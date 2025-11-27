/**
 * 快速创建行程测试脚本（方案二：手动创建）
 * 使用方法: node test-quick-create.js
 */

const API_BASE = 'http://localhost:3000/api';

// 测试数据：3天冰岛之旅
const journeyData = {
  destination: '冰岛',
  startDate: '2025-12-01',
  days: 3,
  data: {
    days: [
      {
        day: 1,
        date: '2025-12-01',
        activities: [
          {
            time: '10:00',
            title: '参观蓝湖温泉',
            type: 'attraction',
            duration: 120,
            location: { lat: 63.8808, lng: -22.4494 },
            notes: '享受地热温泉，放松身心',
            cost: 50
          },
          {
            time: '14:00',
            title: '午餐',
            type: 'meal',
            duration: 60,
            location: { lat: 63.8808, lng: -22.4494 },
            notes: '当地特色餐厅',
            cost: 30
          },
          {
            time: '16:00',
            title: '雷克雅未克市区游览',
            type: 'attraction',
            duration: 180,
            location: { lat: 64.1466, lng: -21.9426 },
            notes: '参观哈尔格林姆教堂、珍珠楼等',
            cost: 20
          }
        ]
      },
      {
        day: 2,
        date: '2025-12-02',
        activities: [
          {
            time: '09:00',
            title: '黄金圈一日游',
            type: 'attraction',
            duration: 480,
            location: { lat: 64.2553, lng: -20.5133 },
            notes: '参观间歇泉、黄金瀑布、辛格维利尔国家公园',
            cost: 100
          },
          {
            time: '18:00',
            title: '晚餐',
            type: 'meal',
            duration: 90,
            location: { lat: 64.2553, lng: -20.5133 },
            notes: '品尝冰岛传统美食',
            cost: 40
          }
        ]
      },
      {
        day: 3,
        date: '2025-12-03',
        activities: [
          {
            time: '08:00',
            title: '南岸一日游',
            type: 'attraction',
            duration: 600,
            location: { lat: 63.4194, lng: -19.0069 },
            notes: '参观斯科加瀑布、黑沙滩、冰川',
            cost: 150
          }
        ]
      }
    ],
    totalCost: 420,
    summary: '3天冰岛之旅，探索自然奇观和地热温泉'
  },
  preferences: {
    budget: 'medium',
    travelStyle: 'moderate'
  },
  status: 'draft'
};

async function testQuickCreate() {
  console.log('🚀 开始测试：快速创建行程（方案二）');
  console.log('==================================\n');

  try {
    // 检查后端服务
    console.log('📡 检查后端服务...');
    try {
      const healthCheck = await fetch(`${API_BASE}/health`).catch(() => 
        fetch('http://localhost:3000/health').catch(() => null)
      );
      if (healthCheck && healthCheck.ok) {
        console.log('✅ 后端服务运行正常\n');
      } else {
        console.log('⚠️  无法连接到后端服务，但继续尝试...\n');
      }
    } catch (e) {
      console.log('⚠️  无法连接到后端服务，但继续尝试...\n');
    }

    // 创建行程
    console.log('📤 发送创建行程请求...');
    console.log(`接口: POST ${API_BASE}/v1/journeys\n`);

    const response = await fetch(`${API_BASE}/v1/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include', // 使用 Cookie 认证
      body: JSON.stringify(journeyData)
    });

    const httpCode = response.status;
    console.log(`HTTP 状态码: ${httpCode}\n`);

    const data = await response.json();

    if (httpCode === 200 || httpCode === 201) {
      console.log('✅ 行程创建成功！\n');
      console.log('📋 响应数据:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');

      // 提取 journeyId
      const journeyId = data.data?.id || data.id;
      if (journeyId) {
        console.log(`🎉 行程ID: ${journeyId}\n`);
        console.log(`🔗 可以在前端访问: http://localhost:5173/travel/${journeyId}\n`);

        // 验证行程详情
        console.log('📝 验证行程详情...');
        try {
          const detailResponse = await fetch(`${API_BASE}/v1/journeys/${journeyId}`, {
            credentials: 'include'
          });
          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            console.log('✅ 行程详情获取成功');
            console.log(`   目的地: ${detail.data?.destination || detail.destination}`);
            console.log(`   天数: ${detail.data?.daysCount || detail.daysCount}`);
            console.log(`   开始日期: ${detail.data?.startDate || detail.startDate}`);
            console.log(`   总费用: ${detail.data?.totalCost || detail.totalCost}`);
          }
        } catch (e) {
          console.log('⚠️  无法获取行程详情:', e.message);
        }
      }
    } else {
      console.log('❌ 行程创建失败\n');
      console.log('错误响应:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n💡 提示:');
      console.log('1. 检查后端服务是否运行');
      console.log('2. 检查认证信息是否正确');
      console.log('3. 检查请求数据格式是否正确');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }

  console.log('\n==================================');
  console.log('测试完成');
}

// 运行测试
testQuickCreate();

