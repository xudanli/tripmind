/**
 * 浏览器控制台测试代码
 * 复制以下代码到浏览器控制台执行
 */

// 测试从前端数据格式创建行程
async function testCreateFromFrontendData() {
  // 使用完整的后端 URL（端口 3000）
  const API_BASE = 'http://localhost:3000/api';
  
  const frontendData = {
    "itineraryData": {
      "title": "冰岛之旅",
      "destination": "冰岛",
      "duration": 5,
      "budget": "medium",
      "preferences": ["nature", "adventure"],
      "travelStyle": "moderate",
      "itinerary": [],
      "recommendations": {
        "accommodation": "",
        "transportation": "",
        "food": "",
        "tips": "5天的冰岛之旅，行程包含1个精彩活动，涵盖自然与冒险等类型，让您体验丰富多彩的旅行活动，感受当地生活的美好。行程安排合理，时间充裕，让您充分享受每一刻的美好时光。"
      },
      "days": [
        {
          "day": 1,
          "date": "2025-11-24",
          "timeSlots": [
            {
              "time": "09:00",
              "title": "探秘雷克雅未克大教堂的螺旋天际",
              "activity": "探秘雷克雅未克大教堂的螺旋天际",
              "type": "attraction",
              "coordinates": {
                "lat": 64.1419,
                "lng": -21.9274
              },
              "notes": "登上哈尔格林姆教堂塔顶，俯瞰雷克雅未克彩色屋顶和远山，感受北欧建筑之美。建议提前在线购票避免排队，塔内楼梯较窄，穿舒适鞋。",
              "details": {
                "name": {
                  "chinese": "探秘雷克雅未克大教堂的螺旋天际",
                  "english": "Hallgrímskirkja Spiral Skyline Tour",
                  "local": "Hallgrímskirkja Spiral Skyline Tour"
                },
                "description": "登上哈尔格林姆教堂塔顶，俯瞰雷克雅未克彩色屋顶和远山，感受北欧建筑之美。",
                "notes": "建议提前在线购票避免排队，塔内楼梯较窄，穿舒适鞋。",
                "address": {
                  "chinese": "冰岛雷克雅未克市中心，哈尔格林姆斯教堂，哈尔格林姆斯教堂广场1号",
                  "english": "Hallgrímskirkja, Hallgrímstorg 1, 101 Reykjavík, Iceland",
                  "local": "Hallgrímskirkja, Hallgrímstorg 1, 101 Reykjavík, Iceland"
                },
                "transportation": "公交线路：1路、3路、6路、11路、12路、13路、14路在'哈尔格林姆斯教堂'站下车；步行约5-10分钟可达，沿Skólavörðustígur街前行",
                "openingHours": "教堂主体每日9:00-17:00；观景台夏季（5月-9月）9:00-21:00，冬季（10月-4月）9:00-17:00",
                "pricing": {
                  "detail": "教堂免费进入；观景台门票：成人1000 ISK，儿童（7-16岁）500 ISK，7岁以下免费；学生与老人8折优惠"
                },
                "rating": 4.7,
                "recommendations": {
                  "visitTips": "最佳时间为夏季傍晚（18:00-20:00），游客较少，光线柔和。注意天气变化及临时关闭情况。",
                  "bestTimeToVisit": "夏季傍晚（18:00-20:00）",
                  "nearbyAttractions": "雷克雅未克艺术博物馆、太阳航海者雕塑、Laugavegur购物街、Harpa音乐厅",
                  "visitDuration": 45,
                  "outfitSuggestions": "建议穿保暖层、防风衣、舒适步行鞋；带雨具；教堂内避免穿着暴露衣物。",
                  "culturalTips": "教堂内保持安静、脱帽、避免使用闪光灯。冰岛人友好但直接，无需强制小费。",
                  "bookingInfo": "无需提前预订，可现场购票；与雷克雅未克城市卡结合可享折扣。"
                },
                "contact": {
                  "info": "电话：+354 510 1000；官网：www.hallgrimskirkja.is"
                },
                "accessibility": "设有轮椅通道、电梯和无障碍卫生间",
                "category": "宗教建筑与观景台"
              },
              "cost": 1200,
              "duration": 90
            }
          ]
        }
      ],
      "totalCost": 1200,
      "summary": "5天的冰岛之旅，行程包含1个精彩活动，涵盖自然与冒险等多种类型，让您体验丰富多彩的旅行活动，感受当地生活的美好。"
    },
    "startDate": "2025-11-24"
  };

  try {
    console.log('📤 发送创建行程请求...');
    console.log(`接口: POST ${API_BASE}/v1/journeys/from-frontend-data`);
    console.log('数据:', frontendData);
    
    const response = await fetch(`${API_BASE}/v1/journeys/from-frontend-data`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include', // 使用 Cookie 认证
      body: JSON.stringify(frontendData)
    });
    
    console.log('HTTP 状态码:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 请求失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return;
    }
    
    const result = await response.json();
    console.log('✅ 创建成功:', result);
    
    if (result.data?.id) {
      const journeyId = result.data.id;
      console.log(`🎉 行程ID: ${journeyId}`);
      
      // 检查 activities 是否为空
      const days = result.data.days || [];
      if (days.length > 0) {
        const activities = days[0].activities || [];
        console.log(`📝 第一天活动数量: ${activities.length}`);
        if (activities.length === 0) {
          console.warn('⚠️  activities 数组为空，后端可能没有正确转换 timeSlots');
          console.warn('💡 建议检查后端日志，确认 timeSlots → activities 转换逻辑');
        } else {
          console.log('✅ activities 数据已正确转换');
          console.log('第一个活动:', activities[0]);
        }
      }
      
      // 自动跳转
      console.log(`🔗 跳转到: /travel/${journeyId}`);
      window.location.href = `/travel/${journeyId}`;
    } else {
      console.warn('⚠️  响应中没有 journeyId');
    }
  } catch (error) {
    console.error('❌ 创建失败:', error);
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('💡 无法连接到后端服务，请确保后端服务运行在 http://localhost:3000');
    }
  }
}

// 执行测试
testCreateFromFrontendData();

