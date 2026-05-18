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
const SEARCH_URL = 'https://map.naver.com/v5/search/' + encodeURIComponent(SEARCH_QUERY);

const SELECTORS = {
  // 검색 결과 리스트 관련
  searchIframe: /searchIframe/,
  listItems: '.UEzoS',
  
  // 상세 페이지(Entry) 관련
  entryIframe: /entry/,
  title: '.Fc1rA',
  description: '.zZfO1',
  images: '.K0HzJ img',
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
  // 상세 페이지 iframe으로 전환
  const frame = page.frame({ url: SELECTORS.entryIframe }) || page.mainFrame();

  // 상호명 및 설명 파싱 (의미적 셀렉터가 불가능한 경우 상단 SELECTORS 사용)
  const name = await frame.locator(SELECTORS.title).textContent().catch(() => 'Unknown Studio');
  const description = await frame.locator(SELECTORS.description).textContent().catch(() => 'No description');
  
  // 이미지 파싱 및 업로드
  const imageUrls = await frame.locator(SELECTORS.images).evaluateAll((imgs) => 
    imgs.map((img) => (img as HTMLImageElement).src)
  ).catch(() => []);

  const uploadedImages: string[] = [];
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

  const currentUrl = page.url();
  const placeId = extractPlaceId(currentUrl);
  
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
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Navigating to Naver Map (${SEARCH_QUERY})...`);
    await page.goto(SEARCH_URL, { waitUntil: 'networkidle' });

    // 검색 결과 iframe 로드 대기
    await page.waitForTimeout(3000); 
    const searchFrame = page.frame({ url: SELECTORS.searchIframe }) || page.mainFrame();
    
    const listItems = searchFrame.locator(SELECTORS.listItems);
    const count = await listItems.count();
    const maxItems = Math.min(count, 3);
    
    console.log(`Found ${count} items. Crawling top ${maxItems}...`);

    for (let i = 0; i < maxItems; i++) {
      console.log(`Processing item ${i + 1}/${maxItems}...`);
      await listItems.nth(i).click();
      await page.waitForTimeout(2000); // 상세 페이지 로드 대기
      
      await parseStudioDetails(page, admin.id);
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
