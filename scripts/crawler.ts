// 네이버 지도 합주실 크롤러 스크립트
import 'dotenv/config';
import { chromium, Page } from 'playwright';
import { eq, like } from 'drizzle-orm';
import { db } from '../src/db';
import { users, studios, rooms, equipmentCategories, equipments } from '../src/db/schema';
import { downloadImageAsBuffer, uploadImageToSupabase } from './utils/storage';

// ============================================================
// 설정 및 셀렉터 정의 (유지보수성 향상)
// ============================================================

const SEARCH_QUERY = '합주실';
// v5 -> p 로 변경, 홍대 근처 좌표 기본값
const SEARCH_URL = 'https://map.naver.com/p/search/' + encodeURIComponent(SEARCH_QUERY) + '?c=14.00,126.924,37.555,0,dh';

const SELECTORS = {
  // 검색 결과 리스트 관련
  searchIframe: '#searchIframe',
  listItems: 'li.VLTHu',
  
  // 상세 페이지(Entry) 관련
  entryIframe: '#entryIframe',
  title: 'h1',
  description: '.zZfO1', // 설명을 담는 요소 클래스는 변동 가능성이 높음 (fallback 처리됨)
  images: 'img',
};

// ============================================================
// 헬퍼 함수
// ============================================================

/** 어드민 계정 가져오기 또는 생성 */
async function getAdminUser() {
  const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (adminUsers.length > 0) {
    return adminUsers[0];
  }
  const [newAdmin] = await db.insert(users).values({
    username: 'system_admin',
    passwordHashed: 'hashed_password_dummy',
    nickname: 'System Admin',
    role: 'admin',
  }).returning();
  return newAdmin;
}

/** URL에서 네이버 Place ID 추출 */
function extractPlaceId(url: string): string | null {
  const match = url.match(/place\/(\d+)/);
  return match ? match[1] : null;
}

/** 상세 페이지 파싱 및 데이터 적재 */
async function parseStudioDetails(page: Page, adminId: string) {
  // 상세 페이지 iframe으로 전환 (FrameLocator 사용)
  const frameLocator = page.frameLocator(SELECTORS.entryIframe);
  
  // iframe 로드 대기
  await page.waitForTimeout(2000);

  // 상호명 파싱
  const name = await frameLocator.locator(SELECTORS.title).first().textContent().catch(() => 'Unknown Studio');
  
  // 설명 파싱
  const description = await frameLocator.locator(SELECTORS.description).first().textContent().catch(() => 'No description');
  
  // 이미지 파싱 및 업로드
  const imageUrls = await frameLocator.locator(SELECTORS.images).evaluateAll((imgs) => 
    imgs.map((img) => (img as HTMLImageElement).src).filter(src => src && src.startsWith('http'))
  ).catch(() => []);

  const uploadedImages: string[] = [];
  // 이미지 최대 3장 업로드
  for (const url of imageUrls.slice(0, 3)) {
    try {
      const { buffer, contentType } = await downloadImageAsBuffer(url);
      const ext = contentType.split('/')[1] || 'jpg';
      const fileName = `studio_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
      const publicUrl = await uploadImageToSupabase(buffer, contentType, fileName);
      uploadedImages.push(publicUrl);
    } catch (e) {
      console.error('Image upload failed:', e);
    }
  }

  // URL에서 장소 ID 및 좌표 추출 시도
  let placeId = null;
  let currentUrl = page.url();
  
  // iframe URL을 가져올 수 있는지 확인
  const frames = page.frames();
  for (const f of frames) {
    const id = await f.frameElement().then(el => el.getAttribute('id')).catch(() => null);
    if (id === 'entryIframe') {
      currentUrl = f.url();
      placeId = extractPlaceId(currentUrl);
      break;
    }
  }

  if (!placeId) {
      placeId = extractPlaceId(page.url());
  }
  
  // 위경도 추출 (URL 파라미터 기반)
  let lat = 37.5665;
  let lng = 126.9780;
  const urlMatch = currentUrl.match(/c=\d+,([\d.]+),([\d.]+)/);
  if (urlMatch) {
    lng = parseFloat(urlMatch[1]);
    lat = parseFloat(urlMatch[2]);
  }

  // 멱등성 보장: Place ID를 활용하여 중복 체크
  let existingStudio;
  if (placeId) {
    existingStudio = await db.select()
      .from(studios)
      .where(like(studios.mapUrl, `%place/${placeId}%`))
      .limit(1);
  } else {
    existingStudio = await db.select()
      .from(studios)
      .where(eq(studios.name, name || ''))
      .limit(1);
  }

  let studioId = '';

  if (existingStudio && existingStudio.length === 0) {
    console.log(`Inserting studio: ${name} (Place ID: ${placeId})`);
    const [newStudio] = await db.insert(studios).values({
      name: name || 'Unnamed Studio',
      mapUrl: currentUrl,
      description,
      images: uploadedImages,
      lat,
      lng,
      status: 'active',
      createdBy: adminId,
    }).returning({ id: studios.id });
    studioId = newStudio.id;
  } else if (existingStudio) {
    console.log(`Studio already exists: ${name} (Place ID: ${placeId})`);
    studioId = existingStudio[0].id;
  }

  // 임시 Room 및 Equipment 적재 로직 (동일 Studio에 대해 중복 생성 방지)
  if (studioId) {
    const roomsExist = await db.select().from(rooms).where(eq(rooms.studioId, studioId)).limit(1);
    if (roomsExist.length === 0) {
      const [newRoom] = await db.insert(rooms).values({
        studioId,
        name: '기본 합주실',
        images: [],
        pricePerHour: 15000,
        minCapacity: 1,
        maxCapacity: 6,
        status: 'active',
        createdBy: adminId,
      }).returning({ id: rooms.id });

      let [category] = await db.select().from(equipmentCategories).limit(1);
      if (!category) {
        [category] = await db.insert(equipmentCategories).values({ typeName: '기타 앰프' }).returning();
      }

      await db.insert(equipments).values({
        roomId: newRoom.id,
        categoryId: category.id,
        name: 'Marshall JCM800',
        status: 'active',
        createdBy: adminId,
      });
    }
  }
}

// ============================================================
// 메인 실행 로직
// ============================================================

async function main() {
  console.log('Starting crawler...');
  const admin = await getAdminUser();
  console.log(`Using admin user: ${admin.username} (${admin.id})`);

  const browser = await chromium.launch({ headless: true });
  // 모바일/데스크톱 뷰포트 및 User-Agent 명시 (Naver Map 렌더링 우회 방지)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to Naver Map (${SEARCH_QUERY})...`);
    await page.goto(SEARCH_URL, { waitUntil: 'networkidle' });

    // 검색 결과 iframe 로드 대기
    await page.waitForTimeout(4000); 
    
    // FrameLocator 사용
    const searchFrame = page.frameLocator(SELECTORS.searchIframe);
    const listItems = searchFrame.locator(SELECTORS.listItems);
    
    const count = await listItems.count();
    const maxItems = Math.min(count, 3);
    
    console.log(`Found ${count} items. Crawling top ${maxItems}...`);

    for (let i = 0; i < maxItems; i++) {
      console.log(`Processing item ${i + 1}/${maxItems}...`);
      // a 태그 클릭으로 상세 페이지 오픈
      await listItems.nth(i).locator('a').first().click();
      await page.waitForTimeout(3000); // 상세 페이지 로드 대기
      
      await parseStudioDetails(page, admin.id);
      
      // 검색 결과 리스트로 포커스 복귀 (필요 시)
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.error('Crawler error:', error);
  } finally {
    await browser.close();
    console.log('Crawler finished.');
    process.exit(0);
  }
}

main().catch(console.error);
