export default {
  // 导航和通用
  common: {
    back: '返回',
    next: '下一步',
    prev: '上一步',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    search: '搜索',
    loading: '加载中...',
    submit: '提交',
      send: '发送',
      copy: '复制',
      copied: '已复制',
      copyFailed: '复制失败',
      saveSuccess: '保存成功'
  },

  // 首页
  home: {
    title: '你好，我是你的AI旅行伙伴',
    subtitle: '旅行从这里开始 —— 你想怎么出发？',
    plannerMode: {
      title: '✈️ 我已有计划',
      subtitle: '（Planner模式）',
      description: '我已经知道去哪，只想让你帮我安排好一切。',
      quote: '帮我高效规划一次旅行',
      features: [
        '🎯 高效、可执行的行程设计',
        '📊 专业清晰的旅行策划师',
        '⚡ 动态调整与优化建议'
      ]
    },
    seekerMode: {
      title: '🌿 我想随心走走',
      subtitle: '（Seeker模式）',
      description: '我不知道去哪，只想去一个让我舒服的地方。',
      quote: '我只是想放松一下',
      features: [
        '💭 从心出发，找到"刚刚好的地方"',
        '🤗 温柔理解的旅行心伴',
        '🌸 情感化的推荐与陪伴'
      ]
    },
    inspirationMode: {
      title: '✨ 我有灵感',
      subtitle: '（Inspiration模式）',
      description: '我脑海里有个想法，帮我把它变成旅程。',
      quote: '想体验海洋生物摄影',
      features: [
        '🧠 自然语言理解你的意图',
        '🎨 将灵感转化为主题旅程',
        '🔮 AI智能推荐匹配体验'
      ]
    },
    inspiration: {
      recommendedLocations: '推荐地点（请选择一个）',
      recommendedLocation: '推荐地点',
      recommendedDuration: '推荐时长',
      budgetRange: '预算范围',
      experienceHighlights: '体验亮点：',
      aiTravelPartnerSays: 'AI 旅行伙伴说：',
      createJourney: '创建旅程',
      viewMoreInspiration: '查看更多灵感',
      selectLocationFirst: '请先选择一个推荐地点',
      generateDetailedItinerary: '生成详细行程',
      chooseDestinationHint: '请选择一个心动的目的地后点击“生成详细行程”，我会补上所有细节。',
      detailedJourneyRequired: '请先为选中的目的地生成详细行程',
      candidatesReady: '候选目的地已生成，请选择想去的地点并继续生成详细行程。'
    }
  },

  // 旅行列表
  travelList: {
    title: '🗺️ 我的旅程',
    newJourney: '新旅程 +',
    emptyTitle: '还没有旅程',
    emptyDescription: '点击"新旅程 +"开始规划你的第一次旅行吧！',
    createFirst: '创建第一个旅程',
    travelMode: {
      planner: '规划',
      seeker: '随心',
      inspiration: '灵感'
    },
    status: {
      draft: '草稿',
      active: '进行中',
      completed: '已完成'
    },
    editCover: '编辑封面',
    toBeDetermined: '待定',
    day: '天',
    peopleTraveling: '人同行',
    budget: '预算',
    editJourney: '编辑旅程',
    deleteJourney: '删除旅程',
    confirmDelete: '确认删除',
    confirmDeleteContent: '确定要删除旅程"{title}"吗？',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    logout: '登出',
    confirmLogout: '确认登出',
    aiChat: '继续旅程对话',
    editFeatureDeveloping: '编辑功能开发中...',
    coverEditDeveloping: '封面编辑功能开发中...',
    journeyCreated: '已为你创建新旅程！',
    continueConversation: '继续旅程对话'
  },

  // 旅行详情
  travelDetail: {
    title: '旅行详情',
    backToJourney: '返回我的旅程',
    welcome: '欢迎回来。上次我们走到第{day}天，准备继续出发吗？',
    aiAssistant: 'AI 旅行助手',
    aiSuggestion: {
      planner1: '我帮你计算了一下，若提前出发一小时能节省20分钟交通时间。',
      planner2: '想要我帮你优化今天的行程安排吗？',
      planner3: '今天天气很好，建议将户外活动提前。',
      seeker1: '今天阳光很柔，我帮你留出一个下午的空白，好吗？',
      seeker2: '你今天心情好像有些疲惫，要不要我调整一下计划？',
      seeker3: '附近有个很安静的书店，要不要我标注在地图上？',
      inspiration1: '你提到"海底的光"，我找到几个潜点，要不要我帮你生成一个灵感板？',
      inspiration2: '如果加入夜潜拍摄，会不会更符合你的主题？',
      inspiration3: '我帮你收集了类似的摄影作品，要看看吗？'
    },
    edit: '✏️ 编辑',
    aiOptimize: '🪄 AI优化',
    viewMap: '🗺️ 查看地图',
    timeline: '🕒 行程计划',
    addNewDay: '添加新行程日',
    taskManagement: '📋 任务管理',
    budget: '💰 预算规划',
    aiOptimizeSavings: '🪄 AI优化节省建议',
    files: '📎 文件区',
    members: '👥 旅伴管理',
    inviteMember: '邀请旅伴',
    memberManagement: {
      owner: '所有者',
      admin: '管理员',
      member: '成员',
      tasks: '个任务',
      totalTasks: '总任务数',
      assignedTasks: '已分配',
      costSummary: '成本分摊',
      total: '总计',
      manageCostSplit: '管理分摊',
      inviteMember: '邀请成员',
      email: '邮箱',
      emailPlaceholder: '请输入邮箱地址',
      emailRequired: '请输入邮箱地址',
      role: '角色',
      message: '邀请消息',
      messagePlaceholder: '可选：添加邀请消息',
      inviteSent: '邀请已发送',
      assignTask: '分配任务',
      task: '任务',
      selectMember: '选择成员',
      selectTask: '选择任务',
      selectTaskAndMember: '请选择成员和任务',
      taskAssigned: '任务已分配',
      costSplit: '成本分摊',
      expense: '支出项目',
      expensePlaceholder: '例如：机票、酒店、餐饮等',
      amount: '金额',
      amountPlaceholder: '请输入金额',
      splitBy: '分摊方式',
      equal: '平均分摊',
      custom: '自定义分摊',
      splitDetails: '分摊明细',
      splitAmountMismatch: '分摊金额总和必须等于总金额',
      fillExpenseInfo: '请填写完整的支出信息',
      costSplitSaved: '成本分摊已保存',
      remove: '移除成员',
      memberRemoved: '成员已移除'
    },
    uploadFile: '上传文件',
    chatPlaceholder: '开始和 AI 对话，获取旅行建议吧',
    newMessages: '有新消息，点击查看',
    chatInputPlaceholder: '输入消息...',
    discussion: {
      addToItinerary: '添加到行程',
      noItinerary: '当前没有行程数据，无法添加活动',
      invalidDay: '无效的日期',
      activityAdded: '活动已添加',
      newActivity: '新活动',
      replaceActivity: '替换活动',
      replaceActivityConfirm: '该时间段已有活动，是否替换？',
      itineraryCard: '行程建议',
      generatingDetails: '正在生成活动详情...',
      detailsGenerated: '活动详情已生成',
      aiEnrichmentFailed: 'AI 生成详情失败，已使用基础信息',
      aiEnrichmentError: '生成活动详情时出错'
    },
    tasks: '📋 任务清单',
    taskPlaceholder: '添加新任务...',
    taskCompleted: '已完成',
    clearCompleted: '清除已完成',
    budgetManagement: '💰 预算管理',
    budgetSpent: '已花费',
    budgetTotal: '总预算',
    budgetRemaining: '剩余',
    editBudget: '编辑预算',
    budgetTotalPlaceholder: '请输入总预算',
    budgetSpentPlaceholder: '请输入已花费金额',
    budgetInvalid: '预算金额不能为负数',
    budgetSpentExceedTotal: '已花费金额不能超过总预算',
    budgetSaved: '预算已更新',
    budgetWarning: '预算预警',
    budgetExceeded: '预算已超支，请注意控制花费',
    budgetWarningDesc: '预算已使用{percent}%，请注意控制花费',
    addExpense: '添加支出',
    expenseDetails: '支出明细',
    noExpenses: '暂无支出记录',
    editExpense: '编辑支出',
    expenseTitle: '支出名称',
    expenseTitlePlaceholder: '例如：机票、酒店、餐饮等',
    expenseAmount: '金额',
    expenseAmountPlaceholder: '请输入金额',
    expenseCurrency: '货币',
    expenseCategory: '分类',
    expenseCategoryPlaceholder: '选择分类',
    expenseLocation: '位置/商家',
    expenseLocationPlaceholder: '例如：Leonard\'s Bakery',
    expensePayer: '付款人',
    expensePayerPlaceholder: '选择付款人',
    expenseSplit: '分摊',
    expenseSplitPlaceholder: '选择分摊方式',
    expenseSplitNone: '不分摊',
    expenseSplitEqual: '平均分摊',
    expenseSplitCustom: '自定义分摊',
    expenseSplitDetails: '分摊详情',
    expenseSplitAmount: '金额',
    expenseSplitMismatch: '分摊总额与费用金额不一致',
    expenseDate: '日期',
    expenseDatePlaceholder: '选择日期（可选）',
    expenseNotes: '备注',
    expenseNotesPlaceholder: '备注信息（可选）',
    expenseInvalid: '请填写完整的支出信息',
    expenseAdded: '支出已添加',
    expenseUpdated: '支出已更新',
    expenseDeleted: '支出已删除',
    confirmDeleteExpense: '确认删除',
    confirmDeleteExpenseContent: '确定要删除这条支出记录吗？',
    currencyHint: '使用目的地货币记录',
    noFiles: '暂无文件',
    visaGuide: '签证指引',
    noVisaInfo: '暂无签证信息，请确保已设置目的地和国籍信息',
    visaGuideActions: {
      applyVisa: '申请签证',
      applyEvisa: '在线申请电子签证'
    },
    record: '记录',
    started: '已花费',
    totalBudget: '总预算',
    plannerHero: {
      completionLabel: '行程完成度',
      aiSuggestionLabel: '优化建议：',
      editPlan: '编辑计划',
      aiOptimizePath: 'AI优化路径',
      exportPdf: '导出PDF'
    },
    seekerHero: {
      aiMessage: '今天阳光很柔，我帮你留出一个下午的空白，好吗？',
      currentMood: '此刻心情',
      moods: {
        relaxed: '放松',
        happy: '开心',
        calm: '平静'
      },
      recordMood: '记录心情',
      pausePlan: '暂停计划'
    },
    inspirationHero: {
      aiMessage: '你提到"海底的光"，我找到几个潜点照片，你想我帮你拼一张灵感板吗？',
      creationProgress: '灵感转化进度',
      generateBoard: '生成灵感板',
      addMaterial: '添加素材'
    },
    plannerTimeline: {
      title: '📅 详细行程规划',
      listView: '列表视图',
      mapView: '地图视图',
      exportItinerary: '导出行程',
      mapPlaceholder: '地图视图 - 显示所有行程地点',
      optimizeRoute: '智能优化路线',
      edit: '编辑',
      duplicate: '复制',
      delete: '删除',
      confirmDelete: '确认删除',
      confirmDeleteContent: '确定要删除这一天的行程吗？',
      deleteSuccess: '已删除',
      duplicateSuccess: '已复制',
      addTimeSlot: '添加时间点',
      addNewDay: '添加新行程日',
      editDayModal: '编辑行程日',
      estimatedDuration: '预计时长',
      estimatedCost: '预计花费',
      viewMap: '查看地图',
      hours: '小时',
      dayStatus: {
        planned: '已规划',
        inProgress: '进行中',
        completed: '已完成'
      },
      category: {
        transport: '交通',
        dining: '餐饮',
        sightseeing: '观光',
        accommodation: '住宿',
        shopping: '购物'
      }
    },
    plannerSidebar: {
      tasks: '📋 任务管理',
      budget: '💰 预算优化',
      spent: '已花费',
      total: '总预算',
      optimizationTip: '优化建议',
      optimizationDesc: '通过提前预订可节省约15%的开支',
      files: '📎 文件区',
      uploadFile: '上传文件',
      team: '👥 团队协作',
      inviteMember: '邀请成员'
    },
    seekerMoodNotes: {
      recordMood: '记录此刻心情',
      periods: {
        morning: '上午',
        afternoon: '下午',
        evening: '晚上'
      },
      moods: {
        relaxed: '放松',
        happy: '开心',
        calm: '平静'
      },
      feelings: {
        peaceful: '平静',
        relaxed: '放松',
        curious: '好奇',
        pleasant: '愉悦',
        touched: '感动',
        serene: '安然',
        comfortable: '惬意'
      }
    },
    seekerSidebar: {
      aiCompanion: '💬 AI旅行伙伴',
      chatPlaceholder: '和AI聊聊你的心情...',
      moodRecord: '🌙 心情记录',
      moodChart: {
        relaxed: '😌 放松',
        happy: '🥰 开心',
        calm: '😊 平静'
      },
      recommendations: '🌟 今日推荐',
      recWalking: '海边漫步',
      recWalkingDesc: '慢走30分钟，放松心情',
      recCoffee: '咖啡休息',
      recCoffeeDesc: '品尝当地特色咖啡'
    },
    inspirationIdeas: {
      addIdea: '添加新灵感',
      status: {
        ready: '已实现',
        draft: '构思中'
      },
      inspiredBy: '灵感来自',
      category: {
        ocean: '海洋',
        photography: '摄影',
        light: '光线',
        creative: '创意',
        other: '其他'
      }
    },
    inspirationSidebar: {
      creationArea: '✨ 灵感创作区',
      placeholder: '写下你的新想法...',
      generateCard: '生成灵感卡片',
      materialCollection: '🖼️ 素材收集',
      addMaterial: '添加素材',
      aiCreation: '🎨 AI创作中',
      progressConcept: '概念设计',
      progressVisual: '视觉生成',
      progressRefine: '灵感提炼',
      sources: '💡 灵感来源',
      aiDialog: '🤖 AI共创对话',
      dialogPlaceholder: '和AI聊聊你的灵感...',
      extendJourney: '扩展旅程',
      generatePhoto: '生成照片提示词',
      textSketch: '文案草图',
      moodboard: '🎨 视觉拼贴板',
      materials: '📚 素材收集区',
      maturity: '成熟度',
      export: '📤 导出旅程',
      continueCreate: '🔄 继续共创'
    },
    ideaFlow: {
      origin: '灵感起点',
      extension: 'AI延展',
      route: '路线雏形',
      visual: '图像灵感',
      addInspiration: '✍️ 添加新灵感',
      extensionMessage: '我理解了你的灵感。基于"海底光影"，我为你推荐这些适合潜水摄影的目的地...',
      day1: '潜水体验日',
      day2: '珊瑚拍摄日',
      day3: '自主创作日'
    },
    experienceDay: {
      origin: '灵感起点',
      moodboard: '灵感延展（Moodboard）',
      proposal: 'AI生成提案',
      experienceDay: '灵感体验日',
      status: {
        processing: '创作中'
      },
      mood: '情绪',
      timeline: '活动流（Timeline）',
      materials: '用户素材区',
      uploadMaterial: '上传照片/短视频',
      collaborators: '合作者笔记',
      inviteCollaborator: '邀请摄影伙伴留言',
      underwater: '水下光影',
      light: '蓝色渐变',
      music: '宁静音乐',
      aiProposal: '潜水摄影主题体验日',
      proposalTitle: 'AI 生成提案',
      proposalIntro: '根据您的灵感生成的旅行提案',
      highlights: '灵感亮点',
      destinations: '推荐目的地',
      highlight1: {
        title: '生物发光奇观',
        content: '前往马尔代夫或波多黎各的天然发光海湾，夜晚数十亿浮游生物将海水点亮成银河，建议划独木舟用手搅动水面，即可见蓝色星光飞舞。'
      },
      highlight2: {
        title: '珊瑚礁的光影迷宫',
        content: '推荐澳洲大堡礁或红海珊瑚礁，阳光穿透水面形成不断变幻的光影图案，宛如水下万花筒，建议携带水下相机记录这一奇景。'
      },
      highlight3: {
        title: '深海洞穴探秘',
        content: '前往墨西哥尤卡坦半岛天坑或菲律宾洞穴湖，洞口射入的光束在水下形成神圣的"光柱"，宛如进入被遗忘的神庙。'
      },
      destination1: '马尔代夫',
      destination2: '菲律宾妈妈拍',
      dayTitle: 'Day 2 · 蓝梦岛的呼吸',
      moodValue: '宁静 · 光感',
      narration: '这一天的光，学会了呼吸。',
      timeline1: {
        title: '潜水准备',
        desc: '调整曝光补偿'
      },
      timeline2: {
        title: '下潜拍摄',
        desc: '捕捉第一道光'
      },
      timeline3: {
        title: '海滩午餐',
        desc: '逆光人像拍摄'
      },
      timeline4: {
        title: 'AI修图推荐',
        desc: '生成今日光影精选'
      },
      // 新增翻译键
      companions: {
        title: '旅伴留言区',
        empty: '暂无旅伴留言',
        emptyDesc: '邀请你的旅伴加入，分享他们的想法',
        status: {
          searching: '正在寻找灵感',
          traveling: '正在旅行',
          planning: '正在规划'
        },
        notesCount: '条留言'
      },
      visualPoetry: {
        generating: '生成中...',
        defaultTags: '光、瞬间、记录'
      },
      aiSummary: {
        title: 'AI总结诗',
        generating: '正在生成诗意总结...'
      },
      echoStatement: {
        default: '每一个光影，都是你的自画像。'
      },
      imageUpload: {
        placeholder: '点击上传图片',
        uploading: '上传中...',
        replace: '替换图片',
        delete: '删除',
        confirmDelete: '确认删除',
        confirmDeleteContent: '确定要删除这张图片吗？',
        deleteSuccess: '删除成功',
        aiGeneratedCannotDelete: 'AI生成的图片不能删除'
      },
      setAsCover: '设为封面',
      coverImageSet: '已设置为封面图片',
      coverImageSetFailed: '设置封面图片失败',
      noImageSelected: '请先选择一张图片',
      videoNotSupportedForCover: '视频无法设置为封面',
      videoNotSupported: '当前环境不支持播放视频',
      // 活动详情页翻译
      estimatedStay: '预计停留',
      chargingDuration: '充电时长',
      stayDuration: '入住时长',
      minutes: '分钟',
      walking: '步行',
      minutesReachable: '分钟可达',
      walkingNotReachable: '步行不可达',
      bus: '公交',
      route: '路',
      overviewSectionTitle: '机场简介',
      overviewFallback: '体验概要待补充。',
      mapButton: '查看地图',
      myPlanValue: '我的计划：{value} 分钟',
      stayPending: '停留时间待确认',
      weatherUnavailable: '天气信息待补充',
      transportUnavailable: '交通信息待更新',
      transportDurationMinutes: '预计耗时约 {minutes} 分钟',
      transportDistanceKm: '路程约 {distance} 公里',
      transportFromPrevious: '从{origin}前往此处约 {minutes} 分钟',
      transportPreviousStop: '上一站',
      prepSectionTitle: '行前准备',
      prepStayLabel: '停留时间',
      prepOutfitLabel: '着装建议',
      prepOutfitFallback: '建议根据季节准备舒适保暖的衣物。',
      prepTransportLabel: '交通方式',
      prepTransportFallback: '交通方式待补充。',
      prepBookingLabel: '预订提示',
      bookingRequiredShort: '需提前预订',
      bookingOptional: '可现场或线上预订',
      bookingOnsite: '无需预订，可现场办理',
      cultureSectionTitle: '文化与礼仪',
      cultureTipsLabel: '当地提示',
      cultureNotesLabel: '注意事项',
      culturePhrasesLabel: '常用语',
      bookingRequired: '需',
      bookingAdvanceDefault: '提前1天',
      bookingAdvancePrefix: '提前预订',
      noBookingRequired: '无需预订',
      children: '儿童',
      peoplePlus: '人+',
      discount: '折',
      highlightsLabel: '亮点',
      duration: '时长',
      cost: '费用',
      totalCost: '预计总费用',
      transportation: '交通',
      booking: '预订',
      openingHours: '开放时间',
      location: '位置',
      preTripAdvice: '行前建议',
      dressCode: '穿搭',
      bestTime: '最佳时段',
      suitableFor: '适合',
      pricingDetails: '费用详情',
      transportationCost: '交通花费',
      notSuitableFor: '不适合人群',
      notes: '注意事项',
      localName: '当地名称',
      detailedDescription: '详细说明',
      cuisineType: '类型',
      specialty: '特色',
      atmosphere: '氛围',
      politePhrases: '礼貌用语',
      localFriendlyTips: '当地友好建议',
      navigate: '导航',
      book: '预订',
      contact: '联系',
      more: '更多',
      collapse: '收起',
      activityName: '活动名称',
      activityDescription: '活动说明',
      activityType: '活动类型',
      save: '保存',
      cancel: '取消',
      attraction: '景点',
      restaurant: '餐饮',
      accommodation: '住宿',
      shopping: '购物',
      transport: '交通',
      defaultInspirationTitle: '在风中遇见自己',
      defaultCoreInsight: '真正的自由，是在上升与降落之间找到内心的平衡',
      defaultSupportingText: '当放手被看见，视角会更轻，信任也会更靠近。',
      defaultSource: '官方数据',
      defaultRatingPlatform: 'TripAdvisor',
      noAddressInfo: '暂无地址信息',
      noContactInfo: '暂无联系方式',
      address: '地址',
      phone: '电话',
      email: '邮箱',
      website: '网站',
      bookingSuggestion: '预订建议',
      bookingSuggestionAvailable: '仍可提供订票方式',
      viewBookingOptions: '查看订票方式',
      commonBookingPlatforms: '常用预订平台',
      close: '关闭',
      ratingLabel: '评分',
      ratingReviewCount: '共 {count} 条评价',
      reminderLabel: '出行提醒',
      reminderTransport: '请查询当地交通信息',
      reminderOpening: '请查询开放时间',
      reminderTicket: '请查询门票价格（如适用）',
      reminderActivity: '建议提前查询活动信息',
      openingFallback: '请向场馆或官方渠道确认最新开放时间。',
      pricingFallback: '目的地货币：{currency}。票价及其他费用可能会调整，建议提前确认。',
      sourceLabel: '来源：',
      updatedAtLabel: '更新于',
      festivalLabel: '当地节庆',
      eventsSubscribeLabel: '订阅本地活动更新',
      travelSuggestions: '📋 旅行建议',
      bestTimeToVisit: '最佳旅行时间',
      weatherAdvice: '天气建议',
      packingTips: '打包提示',
      localTips: '当地提示',
      informationSource: '信息来源',
      updated: '更新',
      reviews: '条',
      clickToViewReviews: '点击查看评论',
      narrationLabel: 'nara寄语',
      seasonalTip: '季节提示',
      day: 'Day',
      activity: '活动',
      internalTrackQuestion: '思考',
      internalTrackRitual: '仪式',
      internalTrackReflection: '反思',
      subway: '地铁',
      officialWebsite: '官方网站',
      sourceLink: '来源链接',
      outfitSuggestions: '穿搭建议',
      culturalTips: '当地文化友好提示',
      bookingComLabel: 'Booking.com',
      dianpingLabel: '大众点评',
      // 交通预订平台
      skyscanner: 'Skyscanner 天巡',
      googleFlights: 'Google Flights',
      expedia: 'Expedia',
      kayak: 'Kayak',
      flight: '航班',
      // 住宿预订平台
      agoda: 'Agoda',
      airbnb: 'Airbnb',
      hotel: '酒店',
      // 景点预订平台
      getYourGuide: 'GetYourGuide',
      viator: 'Viator',
      // POI搜索相关
      searchNearby: '搜索附近',
      searchCategory: '搜索类别',
      gasStation: '加油站',
      evCharging: '充电桩',
      restArea: '休息站',
      searching: '正在搜索...',
      foundResults: '找到',
      results: '个结果',
      addToItinerary: '添加到行程',
      viewDetails: '查看详情',
      noResults: '未找到相关结果',
      noResultsDefault: '未找到相关结果，可以尝试切换类别或调整搜索位置',
      noResultsRemote: '当前地点位于偏远或极地地区，附近几乎没有公开设施，可尝试选择最近的城市或缩小搜索范围',
      edit: '编辑',
      activityDetailLabel: '活动亮点',
      delete: '删除',
      addActivity: '添加活动',
      confirmDelete: '确认删除',
      confirmDeleteContent: '确定要删除此活动吗？',
      confirm: '确定',
      deleteSuccess: '活动已删除',
      addSuccess: '活动已添加',
      newActivity: '新活动',
      // 人格画像与旅程设计
      personaJourney: '人格画像与旅程设计',
      personaProfile: '人格画像',
      personaType: '类型',
      motivation: '动机',
      dominantEmotion: '主导情绪',
      travelRhythm: '旅行节奏',
      socialPreference: '社交偏好',
      cognitiveNeed: '认知需求',
      foodPreference: '美食偏好',
      journeyDesign: '旅程设计',
      coreInsight: '核心洞察',
      psychologicalFlow: '心理流程',
      symbolicElements: '象征元素',
      recommendedRhythm: '推荐节奏',
      socialMode: '社交模式'
    },
    bookingInfo: {
      title: '订票信息',
      flights: '航班',
      hotels: '酒店',
      activities: '活动',
      transportations: '交通',
      train: '火车',
      bus: '巴士',
      carRental: '租车',
      ferry: '轮渡',
      empty: '暂无订票信息',
      addBooking: '添加订票信息',
      editBooking: '编辑订票信息',
      addSuccess: '添加成功',
      viewBooking: '查看预订',
      confirmationCodeRequired: '请输入确认码',
      incompleteInfo: '请填写完整信息',
      status: {
        confirmed: '已确认',
        pending: '待确认',
        cancelled: '已取消',
        unknown: '未知'
      }
    },
    guides: {
      empty: '暂无相关攻略',
      loadError: '加载攻略失败',
      readMore: '阅读全文',
      total: '共 {count} 篇'
    }
  },

  // 模式选择
  createModal: {
    title: '✨ 创建新旅程',
    description: '选择一个方式开始你的旅程',
    modes: {
      planner: {
        title: '有计划',
        description: '我已经知道去哪，只想让你帮我排好每一步。',
        button: '开始规划'
      },
      seeker: {
        title: '随心走走',
        description: '我不确定去哪，但想找个让我舒服的地方。',
        button: '帮我找个地方'
      },
      inspiration: {
        title: '有灵感',
        description: '我脑海里有个想法，帮我把它变成旅程。',
        button: '生成灵感旅程'
      }
    }
  },

  // 登录相关
  login: {
    title: '💫 让我们一起开始旅行',
    pageTitle: '欢迎回来',
    pageSubtitle: '使用 Google 账号登录，开始你的旅行计划',
    description: '登录后，我们可以帮你保存旅行计划、记住你的偏好，并提供个性化的旅行建议。',
    loginWithGoogle: '使用 Google 账号登录',
    rememberStyle: '让我们记住你的旅行风格，帮你保存灵感',
    rememberPlan: '让我们记住你的旅行计划，帮你保存灵感 ✈️',
    rememberInspiration: '让我们记住你的旅行灵感，帮你保存下来 ✨',
    success: '登录成功！',
    error: '登录失败，请重试',
    postLoginError: '登录后处理失败',
    tips: '使用 Google 账号登录，安全便捷。我们不会获取你的密码，只会获取基本的账号信息用于个性化服务。',
    devLoginDivider: '或者使用临时体验模式',
    devLoginButton: '使用临时体验账号继续',
    devLoginTip: '在 .env.local 中设置 VITE_ENABLE_DEV_LOGIN=true（或 VITE_AUTH_MODE=mock）即可启用，仅供本地调试使用，不会访问真实后端。',
    devLoginSuccess: '已启用体验模式'
  },

  // Planner 模式
  planner: {
    title: '✈️ 已有计划',
    step1: {
      title: '✈️ 你要去哪？',
      description: '告诉我你的目的地，我会为你量身定制行程',
      label: '目的地',
      placeholder: '输入你想去的城市或国家',
      rules: '请输入目的地'
    },
    step2: {
      title: '📅 预计几天？',
      description: '旅行时长会影响行程安排的深度和广度',
      label: '时间',
      returnDate: '返回日期',
      placeholder: '请选择日期',
      selectPlaceholder: '选择旅行天数'
    },
    step3: {
      title: '同行人数',
      description: '一起旅行的人数会影响行程安排',
      label: '人数',
      placeholder: '选择人数'
    },
    step4: {
      title: '💰 预算范围？',
      description: '选择合适的预算范围，我会为你优化行程安排',
      label: '预算范围',
      placeholder: '选择预算范围',
      rules: '请选择预算范围'
    },
    budgetRanges: {
      economy: '经济型',
      economyDesc: '预算有限，追求性价比',
      comfort: '舒适型',
      comfortDesc: '平衡价格与体验',
      luxury: '豪华型',
      luxuryDesc: '追求高品质体验'
    },
    submit: '生成行程规划',
    destination: '目的地',
    days: '天',
    step5: {
      title: '❤️ 偏好类型？',
      description: '选择你感兴趣的旅行类型，我会重点安排相关活动',
      placeholder: '选择你的兴趣偏好'
    },
    step6: {
      title: '🎯 旅行节奏',
      description: '选择一个节奏来安排你的行程',
      placeholder: '选择旅行节奏',
      rules: '请选择旅行节奏'
    },
    preferences: {
      culture: '文化古迹',
      food: '美食体验',
      nature: '自然风光',
      shopping: '购物娱乐',
      adventure: '冒险体验',
      leisure: '休闲度假'
    },
    travelRythm: {
      fast: '快节奏',
      fastDesc: '紧凑安排,高效游览',
      moderate: '中等节奏',
      moderateDesc: '平衡游览与休息',
      slow: '慢节奏',
      slowDesc: '深度体验,轻松游览'
    },
    completeTitle: '规划完成!',
    ready: '准备就绪!',
    readyDescription: '所有信息已收集完毕,点击下方按钮生成你的专属行程',
    summaryTitle: '你的需求摘要',
    itineraryGenerated: '生成行程'
  },

  // Seeker 模式
  seeker: {
    title: '💗 我想随心走走',
    subtitle: '让心情指引你的旅程',
    description: '如果你还没有想好去哪里，回答几个问题，让我为你找到最合适的旅行地',
    step1: {
      title: '😌 你最近的感受如何？',
      description: '选择一个最能描述你当前心情的状态',
      placeholder: '选择你的心情'
    },
    step2: {
      title: '🌟 你想体验什么？',
      description: '选择你这次旅行最想获得的体验',
      placeholder: '选择你想体验的'
    },
    step3: {
      title: '💰 你的预算范围',
      description: '选择合适的预算范围',
      placeholder: '选择预算范围'
    },
    nextStep: '下一步',
    prevStep: '上一步',
    submit: '为我推荐',
    moods: {
      calm: '平静放松',
      calmDesc: '远离喧嚣，寻找内心的平静',
      active: '活力充沛',
      activeDesc: '充满能量，想要探索世界',
      romantic: '浪漫温馨',
      romanticDesc: '寻找浪漫，体验甜蜜',
      adventurous: '冒险刺激',
      adventurousDesc: '追求刺激，挑战自我',
      cultural: '文化探索',
      culturalDesc: '深入了解不同文化'
    },
    experiences: {
      sightseeing: '观光游览',
      sightseeingDesc: '参观名胜古迹，感受历史',
      nature: '自然风光',
      natureDesc: '亲近自然，享受美景',
      food: '美食探索',
      foodDesc: '品尝地道美食，体验文化',
      shopping: '购物血拼',
      shoppingDesc: '购买纪念品和特产',
      nightlife: '夜生活',
      nightlifeDesc: '体验当地夜生活',
      adventure: '冒险活动',
      adventureDesc: '尝试刺激的户外活动'
    },
    budgetRanges: {
      economy: '经济型',
      economyDesc: '预算有限，追求性价比',
      comfort: '舒适型',
      comfortDesc: '平衡价格与体验',
      luxury: '豪华型',
      luxuryDesc: '追求高品质体验'
    },
    step4: {
      title: '你希望旅行多长时间？',
      description: '选择合适的时间长度，让旅行更从容',
      duration: '时长'
    },
    durations: {
      weekend: '周末',
      weekendDesc: '2-3天的短途旅行',
      week: '一周',
      weekDesc: '5-7天的深度体验',
      extended: '更长',
      extendedDesc: '10天以上的慢旅行'
    }
  },

  // Inspiration 模式
  inspiration: {
    title: '✨ 我有灵感',
    subtitle: '将灵感转化为真实体验',
    description: '描述你的灵感，让我帮你把它转化为完整的旅行计划',
    prompt: '💡 灵感描述',
    placeholder: '描述你的旅行灵感，比如："我想在巴厘岛的日出时分，躺在沙滩上听海浪声..."',
    generate: '生成灵感旅程',
    tips: {
      title: '💡 灵感提示',
      examples: [
        '在普罗旺斯的薰衣草田里拍一组婚纱照',
        '去冰岛看极光，顺便泡温泉',
        '在京都的樱花季，体验传统的茶道文化'
      ]
    },
    hint: {
      title: 'AI 灵感助手'
    }
  }
}
