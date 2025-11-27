#!/bin/bash

# 快速创建行程测试脚本（方案二：手动创建）
# 使用方法: ./test-quick-create.sh

API_BASE="http://localhost:3000/api"
# 注意：如果使用 JWT Token，请替换下面的 YOUR_TOKEN
# 如果使用 Cookie 认证，可以移除 Authorization 头

echo "🚀 开始测试：快速创建行程（方案二）"
echo "=================================="
echo ""

# 检查后端服务
echo "📡 检查后端服务..."
if curl -s "${API_BASE}/health" > /dev/null 2>&1 || curl -s "http://localhost:3000/health" > /dev/null 2>&1; then
  echo "✅ 后端服务运行正常"
else
  echo "⚠️  无法连接到后端服务，但继续尝试..."
fi
echo ""

# 创建行程数据
echo "📝 准备创建行程数据..."
JOURNEY_DATA=$(cat <<EOF
{
  "destination": "冰岛",
  "startDate": "2025-12-01",
  "days": 3,
  "data": {
    "days": [
      {
        "day": 1,
        "date": "2025-12-01",
        "activities": [
          {
            "time": "10:00",
            "title": "参观蓝湖温泉",
            "type": "attraction",
            "duration": 120,
            "location": { "lat": 63.8808, "lng": -22.4494 },
            "notes": "享受地热温泉，放松身心",
            "cost": 50
          },
          {
            "time": "14:00",
            "title": "午餐",
            "type": "meal",
            "duration": 60,
            "location": { "lat": 63.8808, "lng": -22.4494 },
            "notes": "当地特色餐厅",
            "cost": 30
          },
          {
            "time": "16:00",
            "title": "雷克雅未克市区游览",
            "type": "attraction",
            "duration": 180,
            "location": { "lat": 64.1466, "lng": -21.9426 },
            "notes": "参观哈尔格林姆教堂、珍珠楼等",
            "cost": 20
          }
        ]
      },
      {
        "day": 2,
        "date": "2025-12-02",
        "activities": [
          {
            "time": "09:00",
            "title": "黄金圈一日游",
            "type": "attraction",
            "duration": 480,
            "location": { "lat": 64.2553, "lng": -20.5133 },
            "notes": "参观间歇泉、黄金瀑布、辛格维利尔国家公园",
            "cost": 100
          },
          {
            "time": "18:00",
            "title": "晚餐",
            "type": "meal",
            "duration": 90,
            "location": { "lat": 64.2553, "lng": -20.5133 },
            "notes": "品尝冰岛传统美食",
            "cost": 40
          }
        ]
      },
      {
        "day": 3,
        "date": "2025-12-03",
        "activities": [
          {
            "time": "08:00",
            "title": "南岸一日游",
            "type": "attraction",
            "duration": 600,
            "location": { "lat": 63.4194, "lng": -19.0069 },
            "notes": "参观斯科加瀑布、黑沙滩、冰川",
            "cost": 150
          }
        ]
      }
    ],
    "totalCost": 420,
    "summary": "3天冰岛之旅，探索自然奇观和地热温泉"
  },
  "preferences": {
    "budget": "medium",
    "travelStyle": "moderate"
  },
  "status": "draft"
}
EOF
)

echo "✅ 行程数据准备完成"
echo ""

# 发送创建请求
echo "📤 发送创建行程请求..."
echo "接口: POST ${API_BASE}/v1/journeys"
echo ""

# 尝试使用 Cookie 认证（如果后端支持）
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/v1/journeys" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --cookie-jar /tmp/cookies.txt \
  --cookie /tmp/cookies.txt \
  -d "${JOURNEY_DATA}")

# 分离响应体和状态码
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP 状态码: ${HTTP_CODE}"
echo ""

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ 行程创建成功！"
  echo ""
  echo "📋 响应数据:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  
  # 提取 journeyId
  JOURNEY_ID=$(echo "$BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)
  if [ -n "$JOURNEY_ID" ] && [ "$JOURNEY_ID" != "null" ]; then
    echo "🎉 行程ID: ${JOURNEY_ID}"
    echo ""
    echo "🔗 可以在前端访问: http://localhost:5173/travel/${JOURNEY_ID}"
    echo ""
    echo "📝 验证行程详情:"
    echo "curl -X GET \"${API_BASE}/v1/journeys/${JOURNEY_ID}\" --cookie /tmp/cookies.txt | jq '.'"
  fi
else
  echo "❌ 行程创建失败"
  echo ""
  echo "错误响应:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 提示:"
  echo "1. 检查后端服务是否运行: curl http://localhost:3000/api/health"
  echo "2. 检查认证信息是否正确"
  echo "3. 检查请求数据格式是否正确"
fi

echo ""
echo "=================================="
echo "测试完成"

