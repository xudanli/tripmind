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
      selectLocationFirst: 'Please select a recommended location first',
      generateDetailedItinerary: 'Generate Detailed Itinerary',
      chooseDestinationHint: 'Pick a destination and click "Generate Detailed Itinerary" to fill in the details.',
      detailedJourneyRequired: 'Please generate the detailed itinerary before creating the journey',
      candidatesReady: 'Candidate destinations ready. Choose one you love and generate the detailed itinerary.'
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
    discussionTab: '💬 Discussion (AI + Multi-user Collaboration)',
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
    discussion: {
      addToItinerary: 'Add to Itinerary',
      noItinerary: 'No itinerary data available, cannot add activity',
      invalidDay: 'Invalid day',
      activityAdded: 'Activity added',
      newActivity: 'New Activity',
      replaceActivity: 'Replace Activity',
      replaceActivityConfirm: 'There is already an activity at this time, replace it?',
      itineraryCard: 'Itinerary Suggestion',
      generatingDetails: 'Generating activity details...',
      detailsGenerated: 'Activity details generated',
      aiEnrichmentFailed: 'AI enrichment failed, using basic information',
      aiEnrichmentError: 'Error generating activity details'
    },
    visaGuide: 'Visa Guide',
    noVisaInfo: 'No visa information available. Please ensure destination and nationality are set.',
    visaGuideActions: {
      applyVisa: 'Apply for Visa',
      applyEvisa: 'Apply for E-Visa Online'
    },
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
      setAsCover: 'Set as Cover',
      coverImageSet: 'Cover image set successfully',
      coverImageSetFailed: 'Failed to set cover image',
      noImageSelected: 'Please select an image first',
      videoNotSupportedForCover: 'Video cannot be set as cover',
      videoNotSupported: 'Video playback is not supported in this environment',
      // Activity detail page translations
      estimatedStay: 'Suggested stay',
      chargingDuration: 'Charging time',
      stayDuration: 'Stay duration',
      minutes: 'mins',
      walking: 'Walk',
      minutesReachable: 'mins away',
      walkingNotReachable: 'Not walkable',
      bus: 'Bus ',
      route: 'line',
      overviewSectionTitle: 'At-a-glance',
      overviewFallback: 'Overview coming soon.',
      mapButton: 'View map',
      myPlanValue: 'My plan: {value} mins',
      stayPending: 'Stay time pending',
      weatherUnavailable: 'Weather update pending',
      transportUnavailable: 'Transport info pending',
      transportDurationMinutes: 'Travel time ~{minutes} min',
      transportDistanceKm: 'Distance ~{distance} km',
      transportFromPrevious: 'From {origin} to this stop ~{minutes} min',
      transportPreviousStop: 'previous stop',
      prepSectionTitle: 'Before you go',
      prepStayLabel: 'Stay time',
      prepOutfitLabel: 'What to wear',
      prepOutfitFallback: 'Pack comfortable, weather-ready layers.',
      prepTransportLabel: 'How to get there',
      prepTransportFallback: 'Transport tips coming soon.',
      prepBookingLabel: 'Booking tips',
      bookingRequiredShort: 'Booking required',
      bookingOptional: 'Online or on-site booking available',
      bookingOnsite: 'No booking needed; handle on site',
      cultureSectionTitle: 'Culture & etiquette',
      cultureTipsLabel: 'Local tips',
      cultureNotesLabel: 'Key reminders',
      culturePhrasesLabel: 'Useful phrases',
      bookingRequired: 'Booking required',
      bookingAdvanceDefault: '1 day in advance',
      noAddressInfo: 'No address information available',
      noContactInfo: 'No contact information available',
      accessibility: 'Accessibility',
      nearbyAttractions: 'Nearby Attractions',
      viewMap: 'View Map',
      expand: 'Expand',
      navOverview: 'Overview',
      navTransportTime: 'Transport & Time',
      navPricingBooking: 'Pricing & Booking',
      navTips: 'Tips',
      navNearby: 'Nearby',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      bookingSuggestion: 'Booking Suggestion',
      bookingSuggestionAvailable: 'Booking options still available',
      viewBookingOptions: 'View Booking Options',
      commonBookingPlatforms: 'Common Booking Platforms',
      close: 'Close',
      ratingLabel: 'Rating',
      rating: 'Rating',
      ratingReviewCount: '{count} reviews',
      reviews: 'reviews',
      estimatedCost: 'Estimated Cost',
      visitTips: 'Best Visit Time and Notes',
      bestVisitTime: 'Best Visit Time',
      recommendedDuration: 'Recommended Duration',
      reminderLabel: 'Traveler Advisory',
      reminderTransport: 'Check local transportation information',
      reminderOpening: 'Check opening hours',
      reminderTicket: 'Verify ticket prices (if applicable)',
      reminderActivity: 'Confirm activity details in advance',
      openingFallback: 'Please confirm the latest opening hours directly with the venue.',
      pricingFallback: 'Costs are charged in {currency}. Ticket or experience fees may change—confirm before you go.',
      sourceLabel: 'Source:',
      updatedAtLabel: 'Updated',
      festivalLabel: 'Local Festivals',
      eventsSubscribeLabel: 'Subscribe for event updates',
      travelSuggestions: '📋 Travel Suggestions',
      bestTimeToVisit: 'Best Time to Visit',
      weatherAdvice: 'Weather Advice',
      weather: {
        title: 'Weather',
        loading: 'Loading...',
        unavailable: 'Weather information unavailable',
        error: 'Failed to load weather',
        humidity: 'Humidity',
        windSpeed: 'Wind Speed',
        forecast: 'Forecast'
      },
      packingTips: 'Packing Tips',
      localTips: 'Local Tips',
      informationSource: 'Information Source',
      subway: 'Subway',
      officialWebsite: 'Official Website',
      sourceLink: 'Source Link',
      outfitSuggestions: 'Outfit Suggestions',
      culturalTips: 'Cultural Tips',
      updated: 'Updated',
      clickToViewReviews: 'Click to view reviews',
      narrationLabel: 'Guide Notes',
      seasonalTip: 'Seasonal Tip',
      day: 'Day',
      activity: 'Activity',
      time: 'Time',
      type: 'Type',
      basicInfo: 'Basic Information',
      nameInfo: 'Name Information',
      addressInfo: 'Address Information',
      chineseName: 'Chinese Name',
      englishName: 'English Name',
      chineseAddress: 'Chinese Address',
      englishAddress: 'English Address',
      coordinates: 'Coordinates',
      category: 'Category',
      recommendations: 'Recommendations',
      bookingInfo: 'Booking Information',
      pricingStructure: 'Pricing Structure',
      bookingMethod: 'Booking Method',
      bookingAndInquiry: 'Booking & Inquiry',
      openingHoursAndBooking: 'Opening Hours & Booking',
      bookNow: 'Book Now',
      viewWebsite: 'View Website',
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
      viator: 'Viator',
      // POI search related
      searchNearby: 'Search Nearby',
      searchCategory: 'Search Category',
      gasStation: 'Gas Station',
      evCharging: 'EV Charging Station',
      restArea: 'Rest Area',
      searching: 'Searching...',
      foundResults: 'Found',
      results: 'results',
      addToItinerary: 'Add to Itinerary',
      viewDetails: 'View Details',
      noResults: 'No results found',
      noResultsDefault: 'No nearby places were found. Try switching the category or adjusting the location.',
      noResultsRemote: 'This spot is in a very remote or polar region, so public facilities are scarce. Consider searching the nearest town or widening the search radius.',
      edit: 'Edit',
      activityDetailLabel: 'Activity Highlights',
      delete: 'Delete',
      addActivity: 'Add Activity',
      confirmDelete: 'Confirm Delete',
      confirmDeleteContent: 'Are you sure you want to delete this activity?',
      confirm: 'Confirm',
      deleteSuccess: 'Activity deleted',
      addSuccess: 'Activity added',
      newActivity: 'New Activity',
      // Persona Profile & Journey Design
      personaJourney: 'Persona Profile & Journey Design',
      personaProfile: 'Persona Profile',
      personaType: 'Type',
      motivation: 'Motivation',
      dominantEmotion: 'Dominant Emotion',
      travelRhythm: 'Travel Rhythm',
      socialPreference: 'Social Preference',
      cognitiveNeed: 'Cognitive Need',
      foodPreference: 'Food Preference',
      journeyDesign: 'Journey Design',
      coreInsight: 'Core Insight',
      psychologicalFlow: 'Psychological Flow',
      symbolicElements: 'Symbolic Elements',
      recommendedRhythm: 'Recommended Rhythm',
      socialMode: 'Social Mode',
      defaultInspirationTitle: 'Meeting Yourself in the Wind',
      defaultCoreInsight: 'True freedom is finding inner balance between rising and falling',
      defaultSupportingText: 'When letting go is seen, perspective becomes lighter, and trust draws closer.',
      defaultSource: 'Official Data'
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
    pageTitle: 'Welcome Back',
    pageSubtitle: 'Sign in with Google to start your travel planning',
    description: 'After signing in, we can help you save travel plans, remember your preferences, and provide personalized travel recommendations.',
    loginWithGoogle: 'Sign in with Google',
    rememberStyle: 'Let us remember your travel style and help you save your inspiration',
    rememberPlan: 'Let us remember your travel plan and help you save your inspiration ✈️',
    rememberInspiration: 'Let us remember your travel inspiration and help you save it ✨',
    success: 'Login successful!',
    error: 'Login failed, please try again',
    postLoginError: 'Post-login processing failed',
    tips: 'Sign in with Google for secure and convenient access. We will not access your password, only basic account information for personalized services.',
    devLoginDivider: 'or use offline dev mode',
    devLoginButton: 'Continue with a temporary dev account',
    devLoginTip: 'Enable by setting VITE_ENABLE_DEV_LOGIN=true (or VITE_AUTH_MODE=mock). For local debugging only; data is stored in your browser and no backend call is made.',
    devLoginSuccess: 'Dev mode enabled'
  },

  integrations: {
    title: 'Integrations',
    eventbrite: {
      name: 'Eventbrite',
      description: 'Connect to Eventbrite to bring curated festivals and events into your journeys.',
      loading: 'Fetching status…',
      connectedTag: 'Connected',
      disconnectedTag: 'Not connected',
      connectedAs: 'Connected as {id}',
      unknownUser: 'Unknown user',
      expiresAt: 'Token expires on {date}',
      connectHint: 'Authorize to sync Eventbrite events and enhance your inspiration.',
      connect: 'Connect Eventbrite',
      disconnect: 'Disconnect',
      connectedToast: 'Eventbrite connected successfully',
      disconnectedToast: 'Eventbrite disconnected',
      connectedError: 'Eventbrite connection failed, please try again.',
      connectFailed: 'Failed to start Eventbrite authorization',
      disconnectFailed: 'Failed to disconnect Eventbrite'
    }
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
