export default {
  // Navigation and Common
  common: {
    back: 'Back',
    next: 'Next',
    prev: 'Previous',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    loading: 'Loading...',
    submit: 'Submit',
      send: 'Send',
      copy: 'Copy',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      saveSuccess: 'Saved successfully'
  },

  // Home Page
  home: {
    title: 'Hello, I\'m your AI travel companion',
    subtitle: 'Your journey starts here —— How would you like to begin?',
    plannerMode: {
      title: '✈️ I Have a Plan',
      subtitle: '(Planner Mode)',
      description: 'I already know where to go, just need you to arrange everything for me.',
      quote: 'Help me plan a trip efficiently',
      features: [
        '🎯 Efficient and actionable itinerary design',
        '📊 Professional and clear travel planner',
        '⚡ Dynamic adjustments and optimization suggestions'
      ]
    },
    seekerMode: {
      title: '🌿 I Want to Wander Freely',
      subtitle: '(Seeker Mode)',
      description: 'I don\'t know where to go, I just want to find a place that makes me comfortable.',
      quote: 'I just want to relax',
      features: [
        '💭 Follow your heart to find the "just right" place',
        '🤗 Gentle and understanding travel companion',
        '🌸 Emotional recommendations and companionship'
      ]
    },
    inspirationMode: {
      title: '✨ I Have an Inspiration',
      subtitle: '(Inspiration Mode)',
      description: 'I have an idea in my mind, help me turn it into a journey.',
      quote: 'Want to experience marine life photography',
      features: [
        '🧠 Natural language understanding of your intent',
        '🎨 Transform inspiration into themed journeys',
        '🔮 AI intelligent recommendations for matching experiences'
      ]
    },
    inspiration: {
      recommendedLocations: 'Recommended Locations (Please select one)',
      recommendedLocation: 'Recommended Location',
      recommendedDuration: 'Recommended Duration',
      budgetRange: 'Budget Range',
      experienceHighlights: 'Experience Highlights:',
      aiTravelPartnerSays: 'AI Travel Partner Says:',
      createJourney: 'Create Journey',
      viewMoreInspiration: 'View More Inspiration',
      selectLocationFirst: 'Please select a recommended location first'
    }
  },

  // Travel List
  travelList: {
    title: '🗺️ My Journeys',
    newJourney: 'New Journey +',
    emptyTitle: 'No journeys yet',
    emptyDescription: 'Click "New Journey +" to start planning your first trip!',
    createFirst: 'Create First Journey',
    travelMode: {
      planner: 'Planner',
      seeker: 'Seeker',
      inspiration: 'Inspiration'
    },
    status: {
      draft: 'Draft',
      active: 'In Progress',
      completed: 'Completed'
    },
    editCover: 'Edit Cover',
    toBeDetermined: 'To Be Determined',
    day: 'day(s)',
    peopleTraveling: 'traveling',
    budget: 'Budget',
    editJourney: 'Edit Journey',
    deleteJourney: 'Delete Journey',
    confirmDelete: 'Confirm Delete',
    confirmDeleteContent: 'Are you sure you want to delete journey "{title}"?',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Delete failed',
    logout: 'Logout',
    confirmLogout: 'Confirm Logout',
    aiChat: 'Continue Journey Conversation',
    editFeatureDeveloping: 'Edit feature under development...',
    coverEditDeveloping: 'Cover edit feature under development...',
    journeyCreated: 'New journey created for you!',
    continueConversation: 'Continue Journey Conversation'
  },

  // Travel Detail
  travelDetail: {
    title: 'Travel Details',
    backToJourney: 'Back to My Journeys',
    welcome: 'Welcome back. Last time we reached Day {day}, ready to continue?',
    aiAssistant: 'AI Travel Assistant',
    aiSuggestion: {
      planner1: 'I calculated it - if you leave an hour early, you can save 20 minutes of travel time.',
      planner2: 'Would you like me to optimize today\'s itinerary for you?',
      planner3: 'The weather is great today, I suggest moving outdoor activities earlier.',
      seeker1: 'The sunlight is gentle today, shall I leave you a blank afternoon?',
      seeker2: 'You seem a bit tired today, would you like me to adjust the plan?',
      seeker3: 'There\'s a very quiet bookstore nearby, should I mark it on the map?',
      inspiration1: 'You mentioned "light under the sea", I found some diving spots, would you like me to create an inspiration board?',
      inspiration2: 'What if we add night diving photography to better match your theme?',
      inspiration3: 'I collected some similar photography works for you, would you like to see them?'
    },
    edit: '✏️ Edit',
    aiOptimize: '🪄 AI Optimize',
    viewMap: '🗺️ View Map',
    timeline: '🕒 Itinerary',
    addNewDay: 'Add New Day',
    discussion: '💬 Discussion (AI + Multi-user Collaboration)',
    taskManagement: '📋 Task Management',
    budget: '💰 Budget Planning',
    aiOptimizeSavings: '🪄 AI Optimize for Savings',
    files: '📎 Files',
    members: '👥 Travel Companions',
    inviteMember: 'Invite Companion',
    memberManagement: {
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      tasks: 'tasks',
      totalTasks: 'Total Tasks',
      assignedTasks: 'Assigned',
      costSummary: 'Cost Split',
      total: 'Total',
      manageCostSplit: 'Manage Split',
      inviteMember: 'Invite Member',
      email: 'Email',
      emailPlaceholder: 'Please enter email address',
      emailRequired: 'Please enter email address',
      role: 'Role',
      message: 'Invitation Message',
      messagePlaceholder: 'Optional: Add invitation message',
      inviteSent: 'Invitation sent',
      assignTask: 'Assign Task',
      task: 'Task',
      selectMember: 'Select Member',
      selectTask: 'Select Task',
      selectTaskAndMember: 'Please select member and task',
      taskAssigned: 'Task assigned',
      costSplit: 'Cost Split',
      expense: 'Expense',
      expensePlaceholder: 'e.g., Flight, Hotel, Dining, etc.',
      expenseCurrency: 'Currency',
      expenseLocation: 'Location/Vendor',
      expenseLocationPlaceholder: 'e.g., Leonard\'s Bakery',
      expensePayer: 'Payer',
      expensePayerPlaceholder: 'Select payer',
      expenseSplit: 'Split',
      expenseSplitPlaceholder: 'Select split type',
      expenseSplitNone: 'Don\'t split',
      expenseSplitEqual: 'Split equally',
      expenseSplitCustom: 'Custom split',
      expenseSplitDetails: 'Split details',
      expenseSplitAmount: 'Amount',
      expenseSplitMismatch: 'Split total does not match expense amount',
      expenseDatePlaceholder: 'Select date (optional)',
      amount: 'Amount',
      amountPlaceholder: 'Please enter amount',
      splitBy: 'Split Method',
      equal: 'Equal Split',
      custom: 'Custom Split',
      splitDetails: 'Split Details',
      splitAmountMismatch: 'Split amounts must equal total amount',
      fillExpenseInfo: 'Please fill in complete expense information',
      costSplitSaved: 'Cost split saved',
      remove: 'Remove Member',
      memberRemoved: 'Member removed'
    },
    uploadFile: 'Upload File',
    chatPlaceholder: 'Start chatting with AI to get travel suggestions',
    noFiles: 'No files yet',
    started: 'Spent',
    totalBudget: 'Total Budget',
    plannerHero: {
      completionLabel: 'Trip Completion',
      aiSuggestionLabel: 'Optimization Suggestion: ',
      editPlan: 'Edit Plan',
      aiOptimizePath: 'AI Optimize Route',
      exportPdf: 'Export PDF'
    },
    seekerHero: {
      aiMessage: 'The sunlight is gentle today, shall I leave you a blank afternoon?',
      currentMood: 'Current Mood',
      moods: {
        relaxed: 'Relaxed',
        happy: 'Happy',
        calm: 'Calm'
      },
      recordMood: 'Record Mood',
      pausePlan: 'Pause Plan'
    },
    inspirationHero: {
      aiMessage: 'You mentioned "light under the sea", I found some diving spot photos, would you like me to create an inspiration board for you?',
      creationProgress: 'Inspiration Conversion Progress',
      generateBoard: 'Generate Inspiration Board',
      addMaterial: 'Add Material'
    },
    plannerTimeline: {
      title: '📅 Detailed Itinerary',
      listView: 'List View',
      mapView: 'Map View',
      exportItinerary: 'Export Itinerary',
      mapPlaceholder: 'Map View - Display all itinerary locations',
      optimizeRoute: 'Optimize Route',
      edit: 'Edit',
      duplicate: 'Duplicate',
      delete: 'Delete',
      confirmDelete: 'Confirm Delete',
      confirmDeleteContent: 'Are you sure you want to delete this day?',
      deleteSuccess: 'Deleted',
      duplicateSuccess: 'Duplicated',
      addTimeSlot: 'Add Time Slot',
      addNewDay: 'Add New Day',
      editDayModal: 'Edit Day',
      estimatedDuration: 'Estimated Duration',
      estimatedCost: 'Estimated Cost',
      viewMap: 'View Map',
      hours: 'hours',
      dayStatus: {
        planned: 'Planned',
        inProgress: 'In Progress',
        completed: 'Completed'
      },
      category: {
        transport: 'Transport',
        dining: 'Dining',
        sightseeing: 'Sightseeing',
        accommodation: 'Accommodation',
        shopping: 'Shopping'
      }
    },
    plannerSidebar: {
      tasks: '📋 Task Management',
      budget: '💰 Budget Optimization',
      spent: 'Spent',
      total: 'Total Budget',
      optimizationTip: 'Optimization Suggestion',
      optimizationDesc: 'Save about 15% by booking in advance',
      files: '📎 Files',
      uploadFile: 'Upload File',
      team: '👥 Team Collaboration',
      inviteMember: 'Invite Member'
    },
    seekerMoodNotes: {
      recordMood: 'Record Current Mood',
      periods: {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening'
      },
      moods: {
        relaxed: 'Relaxed',
        happy: 'Happy',
        calm: 'Calm'
      },
      feelings: {
        peaceful: 'Peaceful',
        relaxed: 'Relaxed',
        curious: 'Curious',
        pleasant: 'Pleasant',
        touched: 'Touched',
        serene: 'Serene',
        comfortable: 'Comfortable'
      }
    },
    seekerSidebar: {
      aiCompanion: '💬 AI Travel Companion',
      chatPlaceholder: 'Chat with AI about your mood...',
      moodRecord: '🌙 Mood Record',
      moodChart: {
        relaxed: '😌 Relaxed',
        happy: '🥰 Happy',
        calm: '😊 Calm'
      },
      recommendations: '🌟 Today\'s Recommendations',
      recWalking: 'Beach Walk',
      recWalkingDesc: 'Walk slowly for 30 minutes to relax',
      recCoffee: 'Coffee Break',
      recCoffeeDesc: 'Enjoy local specialty coffee'
    },
    inspirationIdeas: {
      addIdea: 'Add New Inspiration',
      status: {
        ready: 'Implemented',
        draft: 'Ideation'
      },
      inspiredBy: 'Inspired by',
      category: {
        ocean: 'Ocean',
        photography: 'Photography',
        light: 'Light',
        creative: 'Creative',
        other: 'Other'
      }
    },
    inspirationSidebar: {
      creationArea: '✨ Inspiration Creation',
      placeholder: 'Write down your new idea...',
      generateCard: 'Generate Inspiration Card',
      materialCollection: '🖼️ Material Collection',
      addMaterial: 'Add Material',
      aiCreation: '🎨 AI Creation in Progress',
      progressConcept: 'Concept Design',
      progressVisual: 'Visual Generation',
      progressRefine: 'Inspiration Refinement',
      sources: '💡 Inspiration Sources',
      aiDialog: '🤖 AI Co-creation Dialog',
      dialogPlaceholder: 'Talk with AI about your inspiration...',
      extendJourney: 'Extend Journey',
      generatePhoto: 'Generate Photo Prompt',
      textSketch: 'Text Sketch',
      moodboard: '🎨 Visual Moodboard',
      materials: '📚 Material Collection',
      maturity: 'Maturity',
      export: '📤 Export Journey',
      continueCreate: '🔄 Continue Co-creation'
    },
    ideaFlow: {
      origin: 'Origin',
      extension: 'AI Extension',
      route: 'Route Sketch',
      visual: 'Visual Inspiration',
      addInspiration: '✍️ Add New Inspiration',
      extensionMessage: 'I understand your inspiration. Based on "underwater light and shadow", I recommend these destinations suitable for underwater photography...',
      day1: 'Diving Experience Day',
      day2: 'Coral Photography Day',
      day3: 'Independent Creation Day'
    },
    experienceDay: {
      origin: 'Origin',
      moodboard: 'Moodboard Extension',
      proposal: 'AI Generated Proposal',
      experienceDay: 'Experience Day',
      status: {
        processing: 'In Progress'
      },
      mood: 'Mood',
      timeline: 'Activity Timeline',
      materials: 'User Materials',
      uploadMaterial: 'Upload Photos/Videos',
      collaborators: 'Collaborator Notes',
      inviteCollaborator: 'Invite Photography Partners',
      underwater: 'Underwater Light',
      light: 'Blue Gradient',
      music: 'Peaceful Music',
      aiProposal: 'Underwater Photography Experience Day',
      proposalTitle: 'AI Generated Proposal',
      proposalIntro: 'Travel proposal generated based on your inspiration',
      highlights: 'Inspiration Highlights',
      destinations: 'Recommended Destinations',
      highlight1: {
        title: 'Bioluminescent Spectacle',
        content: 'Head to natural bioluminescent bays in Maldives or Puerto Rico, where billions of plankton turn the water into a galaxy at night. Paddle a canoe and stir the water to see blue starlight dancing.'
      },
      highlight2: {
        title: 'Coral Reef Light and Shadow Maze',
        content: 'Recommend Great Barrier Reef or Red Sea coral reefs, where sunlight penetrating the water creates ever-changing light and shadow patterns like an underwater kaleidoscope. Bring your underwater camera.'
      },
      highlight3: {
        title: 'Deep Sea Cave Exploration',
        content: 'Visit cenotes in Mexico\'s Yucatán Peninsula or cave lakes in the Philippines, where light shafts from openings create sacred pillars of light underwater, feeling like entering a forgotten temple.'
      },
      destination1: 'Maldives',
      destination2: 'Philippines Mama Pai',
      dayTitle: 'Day 2 · Breathing of Nusa Lembongan',
      moodValue: 'Peaceful · Light',
      narration: 'The light of this day learned to breathe.',
      timeline1: {
        title: 'Diving Preparation',
        desc: 'Adjust exposure compensation'
      },
      timeline2: {
        title: 'Underwater Shooting',
        desc: 'Capture the first light'
      },
      timeline3: {
        title: 'Beach Lunch',
        desc: 'Backlit portrait shooting'
      },
      timeline4: {
        title: 'AI Photo Editing',
        desc: 'Generate today\'s light selection'
      },
      // New translation keys
      companions: {
        title: 'Travel Companions',
        empty: 'No companion messages yet',
        emptyDesc: 'Invite your travel companions to join and share their thoughts',
        status: {
          searching: 'Searching for inspiration',
          traveling: 'Traveling',
          planning: 'Planning'
        },
        notesCount: 'messages'
      },
      visualPoetry: {
        generating: 'Generating...',
        defaultTags: 'light, moment, record'
      },
      aiSummary: {
        title: 'AI Summary Poem',
        generating: 'Generating poetic summary...'
      },
      echoStatement: {
        default: 'Every light and shadow is your self-portrait.'
      },
      imageUpload: {
        placeholder: 'Click to upload image',
        uploading: 'Uploading...',
        replace: 'Replace image',
        delete: 'Delete',
        confirmDelete: 'Confirm Delete',
        confirmDeleteContent: 'Are you sure you want to delete this image?',
        deleteSuccess: 'Deleted successfully',
        aiGeneratedCannotDelete: 'AI-generated images cannot be deleted'
      },
      // Activity detail page translations
      estimatedStay: 'Estimated Stay',
      minutes: 'minutes',
      walking: 'Walking',
      minutesReachable: 'min reachable',
      walkingNotReachable: 'Not reachable on foot',
      bus: 'Bus',
      route: '',
      bookingRequired: 'Required',
      bookingAdvanceDefault: '1 day in advance',
      bookingAdvancePrefix: 'Book',
      noBookingRequired: 'No booking required',
      children: 'Children',
      peoplePlus: 'people+',
      discount: 'off',
      duration: 'Duration',
      cost: 'Cost',
      totalCost: 'Estimated Total Cost',
      transportation: 'Transportation',
      booking: 'Booking',
      openingHours: 'Opening Hours',
      location: 'Location',
      preTripAdvice: 'Pre-trip Advice',
      dressCode: 'Dress Code',
      bestTime: 'Best Time',
      suitableFor: 'Suitable For',
      pricingDetails: 'Pricing Details',
      transportationCost: 'Transportation Cost',
      notSuitableFor: 'Not Suitable For',
      notes: 'Notes',
      localName: 'Local Name',
      detailedDescription: 'Detailed Description',
      cuisineType: 'Type',
      specialty: 'Specialty',
      atmosphere: 'Atmosphere',
      politePhrases: 'Polite Phrases',
      localFriendlyTips: 'Local Friendly Tips',
      navigate: 'Navigate',
      book: 'Book',
      contact: 'Contact',
      more: 'More',
      collapse: 'Collapse',
      activityName: 'Activity Name',
      activityDescription: 'Activity Description',
      activityType: 'Activity Type',
      save: 'Save',
      cancel: 'Cancel',
      attraction: 'Attraction',
      restaurant: 'Restaurant',
      accommodation: 'Accommodation',
      shopping: 'Shopping',
      transport: 'Transport',
      defaultInspirationTitle: 'Meeting Myself in the Wind',
      defaultCoreInsight: 'True freedom is finding inner balance between rising and falling',
      defaultSupportingText: 'When letting go is seen, perspective becomes lighter, and trust draws closer.',
      defaultSource: 'Official Data',
      defaultRatingPlatform: 'TripAdvisor',
      noAddressInfo: 'No address information available',
      noContactInfo: 'No contact information available',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      bookingSuggestion: 'Booking Suggestion',
      bookingSuggestionAvailable: 'Booking options still available',
      viewBookingOptions: 'View Booking Options',
      commonBookingPlatforms: 'Common Booking Platforms',
      close: 'Close',
      travelSuggestions: '📋 Travel Suggestions',
      bestTimeToVisit: 'Best Time to Visit',
      weatherAdvice: 'Weather Advice',
      packingTips: 'Packing Tips',
      localTips: 'Local Tips',
      informationSource: 'Information Source',
      updated: 'Updated',
      reviews: 'reviews',
      clickToViewReviews: 'Click to view reviews',
      seasonalTip: 'Seasonal Tip',
      day: 'Day',
      activity: 'Activity',
      internalTrackQuestion: 'Reflection',
      internalTrackRitual: 'Ritual',
      internalTrackReflection: 'Reflection',
      bookingComLabel: 'Booking.com',
      dianpingLabel: 'Dianping',
      // Flight booking platforms
      skyscanner: 'Skyscanner',
      googleFlights: 'Google Flights',
      expedia: 'Expedia',
      kayak: 'Kayak',
      flight: 'Flight',
      // Accommodation booking platforms
      agoda: 'Agoda',
      airbnb: 'Airbnb',
      hotel: 'Hotel',
      // Attraction booking platforms
      getYourGuide: 'GetYourGuide',
      viator: 'Viator'
    },
    bookingInfo: {
      title: 'Booking Information',
      flights: 'Flights',
      hotels: 'Hotels',
      activities: 'Activities',
      transportations: 'Transportation',
      train: 'Train',
      bus: 'Bus',
      carRental: 'Car Rental',
      ferry: 'Ferry',
      empty: 'No booking information',
      addBooking: 'Add Booking',
      editBooking: 'Edit Booking',
      addSuccess: 'Added successfully',
      viewBooking: 'View Booking',
      confirmationCodeRequired: 'Please enter confirmation code',
      incompleteInfo: 'Please complete all information',
      status: {
        confirmed: 'Confirmed',
        pending: 'Pending',
        cancelled: 'Cancelled',
        unknown: 'Unknown'
      }
    },
    guides: {
      empty: 'No related guides',
      loadError: 'Failed to load guides',
      readMore: 'Read More',
      total: 'Total {count} articles'
    }
  },

  // Mode Selection
  createModal: {
    title: '✨ Create New Journey',
    description: 'Choose a way to start your journey',
    modes: {
      planner: {
        title: 'Have a Plan',
        description: 'I already know where to go, just need you to arrange every step for me.',
        button: 'Start Planning'
      },
      seeker: {
        title: 'Wander Freely',
        description: 'I\'m not sure where to go, but want to find a comfortable place for me.',
        button: 'Help Me Find a Place'
      },
      inspiration: {
        title: 'Have an Inspiration',
        description: 'I have an idea in my mind, help me turn it into a journey.',
        button: 'Generate Inspiration Journey'
      }
    }
  },

  // Login Related
  login: {
    title: '💫 Let\'s Start Your Journey Together',
    loginWithGoogle: 'Sign in with Google',
    rememberStyle: 'Let us remember your travel style and help you save your inspiration',
    rememberPlan: 'Let us remember your travel plan and help you save your inspiration ✈️',
    rememberInspiration: 'Let us remember your travel inspiration and help you save it ✨'
  },

  // Planner Mode
  planner: {
    title: '✈️ Have a Plan',
    step1: {
      title: '✈️ Where do you want to go?',
      description: 'Tell me your destination, and I\'ll customize the itinerary for you',
      label: 'Destination',
      placeholder: 'Enter the city or country you want to visit',
      rules: 'Please enter destination'
    },
    step2: {
      title: '📅 How many days?',
      description: 'Trip duration affects the depth and breadth of itinerary planning',
      label: 'Dates',
      returnDate: 'Return Date',
      placeholder: 'Please select date',
      selectPlaceholder: 'Select travel days'
    },
    step3: {
      title: 'Number of Travelers',
      description: 'The number of travelers affects itinerary planning',
      label: 'People',
      placeholder: 'Select number of people'
    },
    step4: {
      title: '💰 Budget Range?',
      description: 'Choose an appropriate budget range, and I\'ll optimize the itinerary for you',
      label: 'Budget Range',
      placeholder: 'Select budget range',
      rules: 'Please select budget range'
    },
    budgetRanges: {
      economy: 'Economy',
      economyDesc: 'Limited budget, value for money',
      comfort: 'Comfort',
      comfortDesc: 'Balance between price and experience',
      luxury: 'Luxury',
      luxuryDesc: 'Pursue high-quality experience'
    },
    submit: 'Generate Itinerary',
    destination: 'Destination',
    days: 'day(s)',
    step5: {
      title: '❤️ Preference Type?',
      description: 'Choose the type of travel you are interested in, and I will focus on arranging relevant activities',
      placeholder: 'Select your interests/preferences'
    },
    step6: {
      title: '🎯 Travel Rhythm',
      description: 'Choose a rhythm to arrange your itinerary',
      placeholder: 'Select travel rhythm',
      rules: 'Please select travel rhythm'
    },
    preferences: {
      culture: 'Cultural Heritage',
      food: 'Gourmet Experience',
      nature: 'Natural Scenery',
      shopping: 'Shopping & Entertainment',
      adventure: 'Adventure Experience',
      leisure: 'Leisure Vacation'
    },
    travelRythm: {
      fast: 'Fast Pace',
      fastDesc: 'Tight schedule, efficient sightseeing',
      moderate: 'Medium Pace',
      moderateDesc: 'Balance sightseeing and rest',
      slow: 'Slow Pace',
      slowDesc: 'In-depth experience, relaxed sightseeing'
    },
    completeTitle: 'Planning Complete!',
    ready: 'Ready!',
    readyDescription: 'All information has been collected. Click the button below to generate your exclusive itinerary',
    summaryTitle: 'Your Requirements Summary',
    itineraryGenerated: 'Generate Itinerary'
  },

  // Seeker Mode
  seeker: {
    title: '💗 I Want to Wander Freely',
    subtitle: 'Let your mood guide your journey',
    description: 'If you haven\'t decided where to go, answer a few questions and let me find the most suitable travel destination for you',
    step1: {
      title: '😌 How do you feel recently?',
      description: 'Choose the state that best describes your current mood',
      placeholder: 'Select your mood'
    },
    step2: {
      title: '🌟 What do you want to experience?',
      description: 'Choose what you most want to experience on this trip',
      placeholder: 'Select what you want to experience'
    },
    step3: {
      title: '💰 Your Budget Range',
      description: 'Choose an appropriate budget range',
      placeholder: 'Select budget range'
    },
    nextStep: 'Next',
    prevStep: 'Previous',
    submit: 'Recommend for Me',
    moods: {
      calm: 'Calm & Relaxed',
      calmDesc: 'Escape the hustle, find inner peace',
      active: 'Energetic',
      activeDesc: 'Full of energy, want to explore the world',
      romantic: 'Romantic & Warm',
      romanticDesc: 'Seek romance, experience sweetness',
      adventurous: 'Adventurous & Exciting',
      adventurousDesc: 'Pursue excitement, challenge yourself',
      cultural: 'Cultural Exploration',
      culturalDesc: 'Deep dive into different cultures'
    },
    experiences: {
      sightseeing: 'Sightseeing',
      sightseeingDesc: 'Visit famous places, feel the history',
      nature: 'Natural Scenery',
      natureDesc: 'Get close to nature, enjoy the beauty',
      food: 'Food Exploration',
      foodDesc: 'Taste local cuisine, experience culture',
      shopping: 'Shopping',
      shoppingDesc: 'Buy souvenirs and specialties',
      nightlife: 'Nightlife',
      nightlifeDesc: 'Experience local nightlife',
      adventure: 'Adventure Activities',
      adventureDesc: 'Try exciting outdoor activities'
    },
    budgetRanges: {
      economy: 'Economy',
      economyDesc: 'Limited budget, value for money',
      comfort: 'Comfort',
      comfortDesc: 'Balance between price and experience',
      luxury: 'Luxury',
      luxuryDesc: 'Pursue high-quality experience'
    },
    step4: {
      title: 'How long would you like to travel?',
      description: 'Choose a suitable duration to make the trip more relaxed',
      duration: 'Duration'
    },
    durations: {
      weekend: 'Weekend',
      weekendDesc: '2-3 day short trip',
      week: 'One week',
      weekDesc: '5-7 day in-depth experience',
      extended: 'Longer',
      extendedDesc: 'Slow travel for more than 10 days'
    }
  },

  // Inspiration Mode
  inspiration: {
    title: '✨ I Have an Inspiration',
    subtitle: 'Turn inspiration into real experiences',
    description: 'Describe your inspiration, and let me help you turn it into a complete travel plan',
    prompt: '💡 Inspiration Description',
    placeholder: 'Describe your travel inspiration, e.g.: "I want to lie on the beach watching the sunrise in Bali, listening to the sound of waves..."',
    generate: 'Generate Inspiration Journey',
    tips: {
      title: '💡 Inspiration Tips',
      examples: [
        'Take a wedding photoshoot in the lavender fields of Provence',
        'Go to Iceland to see the aurora and soak in hot springs',
        'Experience traditional tea ceremony in Kyoto during cherry blossom season'
      ]
    },
    hint: {
      title: 'AI Inspiration Assistant'
    }
  }
}
