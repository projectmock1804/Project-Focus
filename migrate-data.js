/**
 * Data Migration Script: Local JSON → Firebase Firestore
 *
 * 사용법:
 * 1. 환경변수 설정 (FIREBASE_SERVICE_ACCOUNT in .env)
 * 2. node migrate-data.js 실행
 * 3. Firebase에 데이터 업로드됨
 */

require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!serviceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT 환경변수 없음');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const tasksFile = path.resolve(__dirname, 'data/tasks.json');
const usersFile = path.resolve(__dirname, 'data/users.json');

async function migrateData() {
  console.log('');
  console.log('📦 로컬 JSON → Firebase Firestore 마이그레이션');
  console.log('===============================================');
  console.log('');

  try {
    // 작업 마이그레이션
    if (fs.existsSync(tasksFile)) {
      console.log('📂 tasks.json 읽는 중...');
      const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      console.log(`   ${tasksData.length}개 작업 발견`);

      let count = 0;
      for (const task of tasksData) {
        await db.collection('tasks').doc(task.id).set(task);
        count++;
      }

      console.log(`   ✅ ${count}개 작업 업로드됨`);
    } else {
      console.log('⏭️  tasks.json 없음 (건너뜀)');
    }

    console.log('');

    // 세션 마이그레이션
    const sessionsFile = path.resolve(__dirname, 'data/sessions.json');
    if (fs.existsSync(sessionsFile)) {
      console.log('📂 sessions.json 읽는 중...');
      const sessionsData = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      console.log(`   ${sessionsData.length}개 세션 발견`);

      let count = 0;
      for (const session of sessionsData) {
        await db.collection('sessions').doc(session.id).set(session);
        count++;
      }

      console.log(`   ✅ ${count}개 세션 업로드됨`);
    } else {
      console.log('⏭️  sessions.json 없음 (건너뜀)');
    }

    console.log('');
    console.log('===============================================');
    console.log('✅ 마이그레이션 완료!');
    console.log('');
    console.log('다음 단계:');
    console.log('1. Firebase Console에서 Firestore 확인');
    console.log('2. 작업이 올바르게 업로드되었나 확인');
    console.log('3. 로컬 JSON 파일은 백업으로 유지 (data/ 폴더)');
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err.message);
    process.exit(1);
  }
}

migrateData();
