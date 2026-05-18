// 네이버 지도 합주실 크롤러 스크립트
import { chromium, Page } from 'playwright';
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { users, studios, rooms, equipmentCategories, equipments } from '../src/db/schema';
import { downloadImageAsBuffer, uploadImageToSupabase } from './utils/storage';

const SEARCH_URL = 'https://map.naver.com/v5/search/%ED%95%합%EC%A3%BC%EC%8B%A4'; // "합주실"

async function getAdminUser() {
  const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (adminUsers.length > 0) {
    return adminUsers[0];
  }
  // 어드민 계정이 없으면 시스템 어드민 생성
  const [newAdmin] = await db.insert(users).values({
    username: 'system_admin',
    passwordHashed: 'hashed_password_dummy',
    nickname: 'System Admin',
    role: 'admin',
  }).returning();
  return newAdmin;
}

async function parseStudioDetails(page: Page, adminId: string) {
  // 실제 네이버 지도는 iframe 내부에 데이터를 렌더링하므로 iframe 컨텍스트를 찾아야 합니다.
  // 이 예제 코드는 스켈레톤 및 구조를 보여주며, 실제 DOM 구조에 맞게 셀렉터를 수정해야 합니다.
  
  // 예시: 상세 페이지 iframe으로 전환
  const frame = page.frame({ url: /entry/ }) || page.mainFrame();

  // 상호명 파싱
  const name = await frame.locator('.Fc1rA').textContent().catch(() => 'Unknown Studio');
  
  // 설명 파싱
  const description = await frame.locator('.zZfO1').textContent().catch(() => 'No description');
  
  // 이미지 파싱 및 업로드
  const imageUrls = await frame.locator('.K0HzJ img').evaluateAll((imgs) => 
    imgs.map((img) => (img as HTMLImageElement).src)
  ).catch(() => []);

  const uploadedImages: string[] = [];
  for (const url of imageUrls.slice(0, 3)) { // 최대 3개 이미지만 테스트
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

  // URL에서 위경도 파출 시도 (단순 예시)
  const currentUrl = page.url();
  let lat = 37.5665;
  let lng = 126.9780;
  // 예: https://map.naver.com/v5/entry/place/12345?c=15,126.978,37.5665,0,0,0,dh
  const urlMatch = currentUrl.match(/c=\d+,([\d.]+),([\d.]+)/);
  if (urlMatch) {
    lng = parseFloat(urlMatch[1]);
    lat = parseFloat(urlMatch[2]);
  }

  // DB에 Studio 저장 (중복 방지를 위해 이름으로 조회)
  const existingStudio = await db.select().from(studios).where(eq(studios.name, name || '')).limit(1);
  let studioId = '';

  if (existingStudio.length === 0) {
    console.log(`Inserting studio: ${name}`);
    const [newStudio] = await db.insert(studios).values({
      name: name || 'Unnamed Studio',
      mapUrl: currentUrl,
      description,
      images: uploadedImages,
      lat,
      lng,
      status: 'active', // 크롤링 데이터는 바로 active 처리
      createdBy: adminId,
    }).returning({ id: studios.id });
    studioId = newStudio.id;
  } else {
    console.log(`Studio already exists: ${name}`);
    studioId = existingStudio[0].id;
  }

  // 임시 Room 및 Equipment 적재 로직 (실제 파싱 로직으로 대체 필요)
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

    // 카테고리 로드 및 장비 추가
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

async function main() {
  console.log('Starting crawler...');
  const admin = await getAdminUser();
  console.log(`Using admin user: ${admin.username} (${admin.id})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to Naver Map...');
    await page.goto(SEARCH_URL, { waitUntil: 'networkidle' });

    // iframe (검색 결과 리스트) 로드 대기
    await page.waitForTimeout(3000); 
    const searchFrame = page.frame({ url: /searchIframe/ }) || page.mainFrame();
    
    // 리스트 아이템 클릭하며 순회 (예제: 첫 3개 항목)
    const listItems = searchFrame.locator('.UEzoS');
    const count = await listItems.count();
    const maxItems = Math.min(count, 3);
    
    console.log(`Found ${count} items. Crawling top ${maxItems}...`);

    for (let i = 0; i < maxItems; i++) {
      await listItems.nth(i).click();
      await page.waitForTimeout(2000); // 상세 페이지 로드 대기
      
      console.log(`Parsing item ${i + 1}...`);
      await parseStudioDetails(page, admin.id);
    }
  } catch (error) {
    console.error('Crawler error:', error);
  } finally {
    await browser.close();
    console.log('Crawler finished.');
    process.exit(0); // Drizzle 연결 종료
  }
}

main().catch(console.error);
