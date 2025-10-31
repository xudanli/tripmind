<template>
  <div class="experience-day" :class="{ 
    'has-background-switch': backgroundImages.length > 0,
    'has-modal-open': imageUploadModalVisible
  }">
    <!-- ① 剥离阶段（summon）：统一卡片风格 -->
    <section 
      id="stage-summon"
      v-if="summonStageData" 
      class="stage-card"
      :style="{ scrollMarginTop: '80px' }"
    >
      <div class="stage-head">
        <h3>{{ summonStageData.title || '放下重负' }}</h3>
        <p class="sub">{{ summonStageData.subtitle || summonStageGoal }}</p>
      </div>
      <ul class="action-list" v-if="summonStageData.activities && summonStageData.activities.length">
        <li
          v-for="(act, idx) in summonStageData.activities.slice(0, 5)"
          :key="`summon-${idx}`"
          class="action-item"
          :class="{ completed: completedActions.has(`summon-${idx}`) }"
        >
          <div class="icon">{{ parseActivityIcon(act) }}</div>
          <div class="meta">
            <div class="title">{{ parseActivityTitle(act) }}</div>
            <div class="desc">{{ parseActivityBenefit(act) }}</div>
          </div>
          <button class="pill" @click="completeAction('summon', idx, act)">
            {{ completedActions.has(`summon-${idx}`) ? '✓ 已完成' : '去做' }}
          </button>
          <transition name="check-glow">
            <div v-if="completedActions.has(`summon-${idx}`)" class="check-mark">✓</div>
          </transition>
        </li>
      </ul>
    </section>
    
    <!-- ② 映照阶段：镜湖映心 -->
    <section 
      id="stage-reflection" 
      class="stage-card reflection-stage-optimized" 
      ref="reflectionStageRef"
      :style="{ scrollMarginTop: '80px' }"
    >
      <div v-if="reflectionStageData">
        <div class="stage-head">
          <h3>{{ reflectionStageData.title || '镜湖映心' }}</h3>
          <p class="sub">{{ reflectionStageData.subtitle || '看清内心真实模样' }}</p>
        </div>
      </div>
      
      <!-- 三卡操作区：统一风格 -->
      <div class="cards">
        <div 
          v-for="(card, idx) in mirrorLakeActionCards" 
          :key="idx"
          class="card"
          :class="{ completed: completedMirrorActions.has(card.key) }"
          @click="handleCardClick(card)"
          @mouseenter="handleCardHover(idx)"
          @mouseleave="handleCardLeave(idx)"
        >
          <div class="head">
            <span class="emoji">{{ card.icon }}</span>
            <h4>{{ card.title }}</h4>
          </div>
          <div class="lines">
            <p class="instruction">{{ card.instruction }}</p>
            <p class="benefit">{{ card.benefit }}</p>
          </div>
          <div class="meta">
            <span v-if="card.duration">⏱ {{ card.duration }}</span>
            <span v-if="card.location">📍 {{ card.location }}</span>
            <span v-if="card.needsHeadphone">🎧 需要耳机</span>
          </div>
          <button
            class="cta btn-outline" 
            @click.stop="performAction(card)"
            :class="{ 'btn-ripple': isRippleActive === card.key }"
          >
            {{ card.buttonText }}
          </button>
          <transition name="check-glow">
            <div v-if="completedMirrorActions.has(card.key)" class="check-mark">✓</div>
          </transition>
        </div>
      </div>
      
      <!-- 感受记录区（时间线） -->
      <div class="reflection-records-section" id="feeling-records">
        <div class="records-header">
          <h2 class="records-title">感受记录</h2>
          <div class="records-filters">
            <button 
              v-for="filter in recordFilters" 
              :key="filter.key"
              class="filter-btn"
              :class="{ active: activeRecordFilter === filter.key }"
              @click="activeRecordFilter = filter.key"
            >
              {{ filter.label }}
            </button>
          </div>
          <a-button size="small" class="export-btn" @click="exportToItinerary">
            <template #icon><export-outlined /></template>
            导出到行程
          </a-button>
    </div>
    
        <!-- 今日记录（置顶） -->
        <div v-if="todayRecords.length > 0" class="records-today">
          <h3 class="today-label">今日</h3>
          <div class="records-timeline">
            <div 
              v-for="(record, idx) in todayRecords" 
              :key="`today-${idx}`"
              class="record-item"
              :class="record.type"
            >
              <div class="record-time">{{ formatRecordTime(record.timestamp) }}</div>
              <div class="record-content">
                <div v-if="record.type === 'text'" class="record-text">{{ record.content }}</div>
                <div v-if="record.type === 'audio'" class="record-audio">
                  <span class="audio-icon">🎧</span>
                  <span>{{ record.duration || '录音' }}</span>
                </div>
                <div v-if="record.type === 'image'" class="record-image">
                  <img :src="record.content" alt="记录图片" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 历史记录 -->
        <div v-if="historyRecords.length > 0" class="records-history">
          <h3 class="history-label">历史</h3>
          <div class="records-timeline">
            <div 
              v-for="(record, idx) in historyRecords" 
              :key="`history-${idx}`"
              class="record-item"
              :class="record.type"
            >
              <div class="record-date">{{ formatRecordDate(record.timestamp) }}</div>
              <div class="record-content">
                <div v-if="record.type === 'text'" class="record-text">{{ record.content }}</div>
                <div v-if="record.type === 'audio'" class="record-audio">
                  <span class="audio-icon">🎧</span>
                  <span>{{ record.duration || '录音' }}</span>
                </div>
                <div v-if="record.type === 'image'" class="record-image">
                  <img :src="record.content" alt="记录图片" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="allRecords.length === 0" class="records-empty">
          <div class="empty-icon">💭</div>
          <p class="empty-text">还没有记录。先完成任一行动，留下你的第一条镜湖心声。</p>
        </div>
      </div>
      
      <!-- 完成计数器 -->
      <transition name="counter-pop">
        <div v-if="todayCompletedCount > 0" class="today-completed-counter">
          今日完成 ×{{ todayCompletedCount }}
        </div>
      </transition>
    </section>
    
    <!-- 保留原映照阶段（隐藏但保留功能） -->
    <div 
      id="stage-awakening-old"
      class="reflection-stage animate-on-scroll" 
      style="display: none;"
      :class="{ 
        'mirror-closed': isMirrorClosed,
        'scene-active': activeSceneType !== null
      }"
    >
      <!-- ① 意象召唤层：云雾/水面/光反射背景 -->
      <div class="reflection-background-layer">
        <div class="background-mist"></div>
        <div class="background-water"></div>
        <div class="background-light"></div>
      </div>

      <!-- 标题与副标题 -->
      <transition name="fade-in">
        <div v-if="isPageReady && reflectionStageContent.title" class="reflection-title-layer">
          <h2 class="reflection-main-title">{{ reflectionStageContent.title }}</h2>
          <p v-if="reflectionStageContent.subtitle" class="reflection-main-subtitle">{{ reflectionStageContent.subtitle }}</p>
        </div>
      </transition>

      <!-- ② 自我映照层：三张活动卡片 -->
      <transition name="fade-in-delayed">
        <div 
          v-if="isPageReady && !activeSceneType" 
          class="reflection-mirror-layer"
          :class="{ 'flash-active': isFlashActive }"
        >
          <p v-if="reflectionStageContent.hint" class="mirror-hint">{{ reflectionStageContent.hint }}</p>
          <div class="reflection-mirror-cards">
            <div
              v-for="(card, index) in reflectionMirrorCards"
              :key="`mirror-${index}`"
              class="mirror-card"
              :class="{ 'card-selected': selectedMirrorCardIndex === index }"
              :style="{ '--card-delay': `${index * 0.2}s`, background: card.bg, '--card-color': card.colorRgb }"
              @click="enterMirrorScene(card, index)"
            >
              <div class="mirror-card-content">
                <div class="mirror-card-icon">{{ card.emotionIcon || '✨' }}</div>
                <p class="mirror-card-text">{{ card.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- ③ 内心回声层：场景沉浸体验 -->
      <transition name="scene-transition">
        <div 
          v-if="activeSceneType" 
          class="reflection-scene-layer"
          :class="[ `scene-${activeSceneType}`, { 'flash-active': isFlashActive } ]"
        >
          <!-- 苔原场景 -->
          <div v-if="activeSceneType === 'tundra'" class="tundra-scene">
            <div class="tundra-horizon"></div>
            <div class="footprint-trail" v-if="showFootprints">
              <div 
                v-for="(footprint, idx) in footprintSteps" 
                :key="idx"
                class="footprint"
                :style="footprint.style"
              ></div>
            </div>
            <div v-if="sceneQuestion" class="scene-question">
              <p class="question-text">{{ sceneQuestion }}</p>
            </div>
          </div>

          <!-- 火山场景 -->
          <div v-if="activeSceneType === 'volcano'" class="volcano-scene">
            <div class="volcano-rock"></div>
            <div class="volcano-glow"></div>
            <div v-if="sceneQuestion" class="scene-question">
              <p class="question-text">{{ sceneQuestion }}</p>
            </div>
            <div v-if="showStoneWriting" class="stone-writing-area">
              <a-textarea
                v-model:value="stoneDreamText"
                :auto-size="{ minRows: 3, maxRows: 6 }"
                class="stone-textarea"
                :placeholder="stonePlaceholder"
                @blur="engraveOnStone"
              />
            </div>
          </div>

          <!-- 极光场景 -->
          <div v-if="activeSceneType === 'aurora'" class="aurora-scene">
            <div class="aurora-lights" ref="auroraLightsRef">
              <div 
                v-for="(light, idx) in auroraLights" 
                :key="idx"
                class="aurora-light"
                :style="light.style"
              ></div>
            </div>
            <div v-if="sceneQuestion" class="scene-question">
              <p class="question-text">{{ sceneQuestion }}</p>
            </div>
            <transition name="fade">
              <div v-if="auroraResponse" class="aurora-response">
                <p class="response-text">{{ auroraResponse }}</p>
              </div>
            </transition>
          </div>

          <!-- 场景退出按钮 -->
          <div class="scene-exit">
            <a-button 
              type="text" 
              size="large"
              class="exit-scene-btn"
              @click="exitMirrorScene"
            >
              <template #icon><left-outlined /></template>
              返回
            </a-button>
          </div>
        </div>
      </transition>

      <!-- ④ 感受记录层：用户输入 -->
      <transition name="fade-up">
        <div 
          v-if="selectedMirrorCardIndex !== null && !activeSceneType" 
          class="reflection-record-layer"
        >
          <h3 class="record-section-title">感受记录</h3>
          <div class="record-input-wrapper">
            <a-textarea
              v-model:value="reflectionRecord"
              :auto-size="{ minRows: 4, maxRows: 10 }"
              class="reflection-record-textarea"
              :placeholder="reflectionRecordPlaceholder"
            />
            <a-button
              type="primary"
              size="large"
              class="save-record-btn"
              @click="saveReflectionRecord"
              :disabled="!reflectionRecord.trim()"
            >
              <template #icon><check-outlined /></template>
              保存印记
            </a-button>
          </div>
          <div v-if="savedReflectionCard" class="reflection-quote-card">
            <div class="quote-icon">💭</div>
            <p class="quote-text">{{ savedReflectionCard }}</p>
          </div>
        </div>
      </transition>

      <!-- ⑤ 心理回收层：镜子合上动画 -->
      <transition name="mirror-close">
        <div 
          v-if="isReflectionRecorded && !isMirrorClosed" 
          class="reflection-close-layer"
        >
          <div class="mirror-close-animation">
            <div class="mirror-left"></div>
            <div class="mirror-right"></div>
          </div>
          <p v-if="mirrorCloseMessage" class="close-message">{{ mirrorCloseMessage }}</p>
          <p v-if="mirrorCloseSubmessage" class="close-submessage">{{ mirrorCloseSubmessage }}</p>
        </div>
      </transition>

      <!-- 过渡到下一阶段按钮 -->
      <transition name="fade-in">
        <div 
          v-if="isMirrorClosed" 
          class="reflection-continue"
        >
          <a-button
            type="primary"
            size="large"
            class="continue-btn"
            @click="proceedToDialogueStage"
          >
            <template #icon><right-outlined /></template>
            {{ reflectionStageContent.continueButton }}
          </a-button>
        </div>
      </transition>
    </div>

    <!-- ③ 觉醒阶段：破晓时刻 -->
    <section id="stage-awakening" class="stage-card" ref="dialogueStageRef" :style="{ scrollMarginTop: '80px' }">
      <div v-if="awakeningStageData">
        <div class="stage-head">
          <h3>{{ awakeningStageData.title || '破晓时刻' }}</h3>
          <p class="sub">{{ awakeningStageData.subtitle || awakeningStageGoal }}</p>
        </div>
        <ul class="action-list" v-if="awakeningStageData.activities && awakeningStageData.activities.length">
          <li
            v-for="(act, idx) in awakeningStageData.activities.slice(0, 5)"
            :key="`awakening-${idx}`"
            class="action-item"
            :class="{ completed: completedActions.has(`awakening-${idx}`) }"
          >
            <div class="icon">{{ parseActivityIcon(act) }}</div>
            <div class="meta">
              <div class="title">{{ parseActivityTitle(act) }}</div>
              <div class="desc">{{ parseActivityBenefit(act) }}</div>
        </div>
            <button class="pill" @click="completeAction('awakening', idx, act)">
              {{ completedActions.has(`awakening-${idx}`) ? '✓ 已完成' : '去做' }}
            </button>
            <transition name="check-glow">
              <div v-if="completedActions.has(`awakening-${idx}`)" class="check-mark">✓</div>
      </transition>
          </li>
        </ul>
    </div>
    </section>

    <!-- 保留原觉醒阶段交互内容（隐藏但保留功能） -->
    <div class="awakening-stage animate-on-scroll" ref="dialogueStageRef" style="display: none;">
      <!-- ① 视觉引导层：图标 + 标题 -->
      <div class="awakening-visual-guide">
        <div class="visual-icon" :class="{ 'active': isVisualGuideActive }">
          <div class="icon-glow">🌠</div>
          <div class="breathing-circle"></div>
        </div>
        <h2 
          v-if="isVisualGuideActive" 
          class="awakening-main-title"
        >
          <span class="title-part-1">觉醒</span>
          <span class="title-separator">·</span>
          <span class="title-part-2">破晓</span>
        </h2>
      </div>

      <!-- ② 心理触发层：引导语 -->
      <transition name="fade-guide">
        <div 
          v-if="isVisualGuideActive" 
          class="awakening-trigger-layer"
          @click="activateTriggerLayer"
          @touchstart="handleTriggerTouchStart"
          @touchend="handleTriggerTouchEnd"
        >
          <p class="trigger-guide-text">{{ awakeningTriggerGuide }}</p>
        </div>
      </transition>

      <!-- ③ 体验行动层：3个行动选项 -->
      <transition name="fade-actions">
        <div 
          v-if="isTriggerLayerActive && awakeningExperiences.length > 0" 
          class="awakening-actions-layer"
        >
          <div class="actions-container">
            <div
              v-for="(experience, index) in awakeningExperiences"
              :key="`experience-${index}`"
              class="experience-action-card"
              :style="{ '--action-delay': `${index * 0.2}s` }"
              @click="openExperienceMode(experience, index)"
            >
              <div class="action-icon">{{ getExperienceIcon(index) }}</div>
              <p class="action-text">{{ experience }}</p>
            </div>
          </div>
        </div>
      </transition>

      <!-- ④ 记录与反思层：感受记录 -->
      <transition name="fade-record">
        <div 
          v-if="isExperienceRecorded" 
          class="awakening-record-layer"
        >
          <h3 class="record-title">感受记录</h3>
          <div class="record-input-area">
            <a-textarea
              v-model:value="awakeningReflection"
              :auto-size="{ minRows: 4, maxRows: 8 }"
              class="record-textarea"
              :placeholder="'写下你的感受，让这份觉醒留下痕迹...'"
            />
            <a-button
              type="primary"
              size="large"
              class="save-reflection-btn"
              @click="saveAwakeningReflection"
            >
              <template #icon><check-outlined /></template>
              保存印记
            </a-button>
          </div>
        </div>
      </transition>

      <!-- ⑤ 延伸引导层：继续前行 -->
      <transition name="fade-continue">
        <div 
          v-if="isReflectionSaved && dialogueStageContent.continueButton" 
          class="awakening-continue-layer"
        >
          <p class="continue-guide-text">{{ dialogueStageContent.conclusion || '带着这份觉醒继续前行' }}</p>
          <a-button
            type="primary"
            size="large"
            class="continue-btn"
            @click="proceedToInternalizationStage"
          >
            <template #icon><right-outlined /></template>
            {{ dialogueStageContent.continueButton }}
          </a-button>
        </div>
      </transition>

      <!-- 体验模式模态框 -->
      <a-modal
        v-model:open="experienceModalVisible"
        :title="currentExperience?.title || ''"
        :footer="null"
        :mask-closable="false"
        :closable="true"
        :class="['themed-modal', isInspirationTheme ? 'inspiration-theme' : '']"
        width="90%"
        :style="{ maxWidth: '600px' }"
      >
        <div class="experience-modal-content">
          <!-- 温泉冥想模式 -->
          <div v-if="currentExperienceMode === 'meditation'" class="experience-meditation">
            <div class="meditation-visual">
              <div class="steam-effect"></div>
            </div>
            <div class="breathing-guide">
              <p class="breathing-instruction">跟随你的呼吸...</p>
              <div class="breathing-indicator">
                <div class="breath-circle" :class="{ 'inhale': isInhaling, 'exhale': !isInhaling }"></div>
              </div>
              <p class="breathing-text">{{ breathingText }}</p>
            </div>
          </div>

          <!-- 对话模式 -->
          <div v-if="currentExperienceMode === 'dialogue'" class="experience-dialogue">
            <div class="dialogue-container">
              <div class="dialogue-visual">
                <div class="dialogue-wave"></div>
              </div>
              <p class="dialogue-question">{{ dialoguePrompt }}</p>
              <a-textarea
                v-model:value="dialogueReflection"
                :auto-size="{ minRows: 4, maxRows: 8 }"
                class="dialogue-textarea"
                :placeholder="dialoguePlaceholder"
              />
              <div class="dialogue-actions">
                <a-button
                  type="primary"
                  size="large"
                  class="themed-btn"
                  :class="{ 'inspiration-theme': isInspirationTheme }"
                  @click="saveDialogueReflection"
                  :disabled="!dialogueReflection.trim()"
                >
                  <template #icon><check-outlined /></template>
                  保存对话
                </a-button>
              </div>
            </div>
          </div>

          <!-- 冰川誓言模式 -->
          <div v-if="currentExperienceMode === 'vow'" class="experience-vow">
            <div class="vow-input-area">
              <p class="vow-prompt">写下你的新誓言</p>
              <a-textarea
                v-model:value="vowText"
                :auto-size="{ minRows: 4, maxRows: 8 }"
                class="vow-textarea"
                placeholder="在这里写下你的誓言..."
              />
              <a-button
                type="primary"
                size="large"
                class="release-vow-btn"
                @click="releaseVow"
                :disabled="!vowText.trim()"
              >
                释放
              </a-button>
            </div>
          </div>

          <!-- 触摸交互模式 -->
          <div v-if="currentExperienceMode === 'touch'" class="experience-touch">
            <div class="touch-guide">
              <p class="touch-instruction">轻抚画面，让温度传递...</p>
              <div class="touch-canvas" 
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="handleTouchEnd"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
              >
                <div 
                  v-for="(ripple, idx) in touchRipples" 
                  :key="idx"
                  class="touch-ripple"
                  :style="ripple.style"
                ></div>
                <div class="touch-warmth-indicator" :style="{ opacity: warmthLevel }">
                  <span class="warmth-text">{{ warmthMessage }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 视觉追踪模式 -->
          <div v-if="currentExperienceMode === 'gaze'" class="experience-gaze">
            <div class="gaze-guide">
              <p class="gaze-instruction">注视中心，让光跟随你的目光...</p>
              <div class="gaze-tracking-area" ref="gazeTrackingRef">
                <div class="gaze-center-point"></div>
                <div 
                  class="gaze-light-beam"
                  :style="{ 
                    transform: `rotate(${gazeAngle}deg)`,
                    opacity: gazeIntensity 
                  }"
                ></div>
                <div class="gaze-focus-ring" :style="{ scale: gazeFocus }"></div>
              </div>
              <p class="gaze-feedback">{{ gazeFeedback }}</p>
            </div>
          </div>

          <!-- 声音交互模式 -->
          <div v-if="currentExperienceMode === 'sound'" class="experience-sound">
            <div class="sound-guide">
              <p class="sound-instruction">发出声音，让空间回应你...</p>
              <div class="sound-visualizer" ref="soundVisualizerRef">
                <div 
                  v-for="(bar, idx) in soundBars" 
                  :key="idx"
                  class="sound-bar"
                  :style="{ height: `${bar.height}%` }"
                ></div>
              </div>
              <button 
                class="sound-record-btn"
                :class="{ 'recording': isRecordingSound }"
                @click="toggleSoundRecording"
              >
                {{ isRecordingSound ? '停止' : '开始' }}
              </button>
              <p class="sound-feedback">{{ soundFeedback }}</p>
            </div>
          </div>

          <!-- 文字粒子模式 -->
          <div v-if="currentExperienceMode === 'text-particle'" class="experience-text-particle">
            <div class="text-particle-guide">
              <p class="particle-instruction">写下你的思绪，让它化作光点...</p>
              <a-textarea
                v-model:value="particleText"
                :auto-size="{ minRows: 3, maxRows: 6 }"
                class="particle-textarea"
                placeholder="写下你的想法..."
                @input="generateTextParticles"
              />
              <div class="particle-canvas" ref="particleCanvasRef">
                <div 
                  v-for="(particle, idx) in textParticles" 
                  :key="idx"
                  class="text-particle"
                  :style="particle.style"
                >
                  {{ particle.char }}
                </div>
              </div>
            </div>
          </div>

          <div class="experience-modal-actions">
            <a-button @click="closeExperienceModal">完成</a-button>
          </div>
        </div>
      </a-modal>

      <!-- 文字吹散动画容器 -->
      <div v-if="isVowReleased" class="vow-particles-container" ref="particlesContainerRef"></div>
    </div>

    <!-- 🌠 觉醒的巅峰：光 × 声 × 字的三重融合 -->
    <div 
      class="awakening-peak-stage" 
      ref="awakeningPeakStageRef"
      :class="{ 'is-active': isAwakeningPeakActive }"
    >
      <!-- 背景光效 -->
      <div class="awakening-light-backdrop">
        <div class="light-center-glow"></div>
          </div>
          
      <!-- 觉醒文字 -->
      <div class="awakening-text-container">
        <transition name="awakening-fade">
          <div v-if="showAwakeningText" class="awakening-text">
            {{ awakeningStageContent.text }}
        </div>
        </transition>
        
        <!-- 入口按钮 -->
        <transition name="awakening-entrance">
          <div v-if="showEntranceButton" class="awakening-entrance">
                      <a-button 
                        type="text" 
              size="large"
              class="entrance-btn"
              @click="enterInternalizationStage"
            >
              {{ awakeningStageContent.entranceText }}
              <template #icon><right-outlined /></template>
                      </a-button>
                    </div>
        </transition>
                  </div>

      <!-- 背景声音控制元素（隐藏） -->
      <div ref="awakeningSoundRef" class="awakening-sound-control"></div>
    </div>

    <!-- ④ 种子沉淀阶段 -->
    <section 
      id="stage-internalization"
      class="stage-card"
      ref="internalizationStageRef"
      :style="{ scrollMarginTop: '80px' }"
    >
      <div v-if="internalizationStageData">
        <div class="stage-head">
          <h3>{{ internalizationStageData.title || '种子沉淀' }}</h3>
          <p class="sub">{{ internalizationStageData.subtitle || internalizationStageGoal }}</p>
      </div>

        <!-- 选项胶囊：晚餐 → 盐制信物 → 日记整理 -->
        <div v-if="internalizationStageData.activities && internalizationStageData.activities.length > 0" class="segment">
          <button
            v-for="(act, idx) in internalizationStageData.activities.slice(0, 3)"
            :key="`capsule-${idx}`"
            class="chip"
            :class="{ 'is-active': selectedCapsule === idx }"
            @click="selectedCapsule = idx"
          >
            {{ parseActivityTitle(act) }}
          </button>
      </div>
        
        <!-- 编辑卡：选项胶囊 + textarea + 保存按钮 -->
        <div class="seed-edit-card" v-if="selectedCapsule === 0">
          <div class="segment letter-template-selector">
            <button 
              v-for="(tmpl, idx) in letterTemplates" 
              :key="idx"
              class="chip"
              :class="{ 'is-active': selectedLetterTemplate === idx }"
              @click="selectedLetterTemplate = idx"
            >
              {{ tmpl.label }}
            </button>
          </div>
          <textarea
            v-model="letterContent"
            :placeholder="letterTemplates[selectedLetterTemplate]?.placeholder"
            class="textbox"
          ></textarea>
          <div class="save-row">
            <span>⏱ 约 {{ estimateLetterTime }} 分钟</span>
            <button class="btn-save" @click="saveLetterToCollection">保存到灵感夹</button>
          </div>
        </div>
        
        <!-- 动作清单（除信件外的其他活动） -->
        <ul class="action-list" v-if="internalizationStageData.activities && internalizationStageData.activities.length > 3">
          <li
            v-for="(act, idx) in internalizationStageData.activities.slice(3)"
            :key="`internalization-${idx + 3}`"
            class="action-item"
            :class="{ completed: completedActions.has(`internalization-${idx + 3}`) }"
          >
            <div class="icon">{{ parseActivityIcon(act) }}</div>
            <div class="meta">
              <div class="title">{{ parseActivityTitle(act) }}</div>
              <div class="desc">{{ parseActivityBenefit(act) }}</div>
            </div>
            <button class="pill" @click="completeAction('internalization', idx + 3, act)">
              {{ completedActions.has(`internalization-${idx + 3}`) ? '✓ 已完成' : '去做' }}
            </button>
            <transition name="check-glow">
              <div v-if="completedActions.has(`internalization-${idx + 3}`)" class="check-mark">✓</div>
            </transition>
          </li>
        </ul>
      </div>
    </section>
    
    <!-- 保留原内化阶段交互内容（隐藏但保留功能） -->
    <div class="internalization-stage animate-on-scroll" style="display: none;">

      <div class="letter-to-future-container">
        <!-- 信封动画容器 -->
        <transition name="envelope-seal">
          <div v-if="!isLetterSealed" class="letter-card" :class="{ 'letter-closing': isSavingLetter }">
            <transition name="fade">
              <div v-if="showLetterEnvelope" class="letter-icon-wrapper">
                <div class="letter-icon">✉️</div>
              </div>
            </transition>
            
            <h3 class="letter-title">{{ internalizationStageContent.letterTitle }}</h3>
            <p class="letter-hint">{{ internalizationStageContent.letterHint }}</p>
          
            <div class="letter-input-area">
              <a-textarea
                v-model:value="letterToFuture"
                :placeholder="internalizationStageContent.placeholder"
                :auto-size="{ minRows: 8, maxRows: 15 }"
                class="letter-textarea"
                :disabled="isSavingLetter"
              />
            </div>

            <div class="letter-actions">
              <a-button
                type="primary"
                size="large"
                :loading="isSavingLetter"
                @click="saveLetterToFuture"
                class="save-letter-btn"
                :disabled="!letterToFuture.trim()"
              >
                <template #icon><check-outlined /></template>
                {{ internalizationStageContent.saveButtonText }}
              </a-button>
              <a-button
                type="text"
                size="large"
                @click="clearLetter"
                v-if="letterToFuture.trim() && !isSavingLetter"
              >
                清空
              </a-button>
            </div>
          </div>

          <!-- 盖章后的信封 -->
          <div v-else class="letter-sealed-card">
            <div class="sealed-envelope">
              <div class="envelope-icon">✉️</div>
              <div class="seal-stamp">✉</div>
            </div>
            <h3 class="letter-title">{{ internalizationStageContent.letterTitle }}</h3>
            <p class="sealed-message">{{ internalizationStageContent.savedMessage }}</p>
          </div>
        </transition>
      </div>

      <!-- 过渡到下一阶段按钮 -->
      <transition name="fade">
        <div 
          v-if="letterToFuture.trim().length > 10" 
          class="internalization-transition"
        >
          <a-button
            type="primary"
            size="large"
            class="transition-btn"
            @click="proceedToTransformStage"
          >
            <template #icon><right-outlined /></template>
            {{ internalizationStageContent.continueButton }}
          </a-button>
        </div>
      </transition>
      
      <!-- 重新编辑按钮（当信件已保存时） -->
      <transition name="fade">
        <div v-if="isLetterSealed" class="edit-letter-again">
          <a-button 
                type="text"
                size="small"
            @click="editLetterAgain"
              >
            <template #icon><edit-outlined /></template>
            重新编辑
              </a-button>
            </div>
      </transition>
    </div>


    <!-- ⑤ 转化阶段 -->
    <section id="stage-transformation" class="stage-card" ref="transformStageRef" :style="{ scrollMarginTop: '80px' }">
      <div v-if="transformationStageData">
        <div class="stage-head">
          <h3>{{ transformationStageData.title || '转化' }}</h3>
          <p class="sub">{{ transformationStageData.subtitle || transformationStageGoal }}</p>
        </div>
        <ul class="action-list" v-if="transformationStageData.activities && transformationStageData.activities.length">
          <li
            v-for="(act, idx) in transformationStageData.activities.slice(0, 5)"
            :key="`transformation-${idx}`"
            class="action-item"
            :class="{ completed: completedActions.has(`transformation-${idx}`) }"
          >
            <div class="icon">{{ parseActivityIcon(act) }}</div>
            <div class="meta">
              <div class="title">{{ parseActivityTitle(act) }}</div>
              <div class="desc">{{ parseActivityBenefit(act) }}</div>
            </div>
            <button class="pill" @click="completeAction('transformation', idx, act)">
              {{ completedActions.has(`transformation-${idx}`) ? '✓ 已完成' : '去做' }}
            </button>
            <transition name="check-glow">
              <div v-if="completedActions.has(`transformation-${idx}`)" class="check-mark">✓</div>
            </transition>
          </li>
        </ul>
      </div>
    </section>
    
    <!-- 保留原转化阶段内容（隐藏但保留功能） -->
    <div class="transform-stage animate-on-scroll" style="display: none;">
      <div class="transform-header">
        <h2 class="transform-title">{{ transformationStageContent?.title }}</h2>
        <p class="transform-subtitle">{{ transformationStageContent?.subtitle }}</p>
      </div>

      <!-- 真实旅人故事卡片 -->
      <div class="traveler-stories-section" v-if="travelerStories.length > 0">
        <h3 class="stories-title">
          <span class="title-icon">🧑‍🤝‍🧑</span>
          同路人的故事
        </h3>
        <div class="stories-grid">
          <div
            v-for="(story, index) in travelerStories"
            :key="index"
            class="story-card"
            :style="{ '--story-delay': `${index * 0.15}s` }"
          >
            <div class="story-header">
              <img :src="story.avatar" :alt="story.name" class="story-avatar" />
              <div class="story-info">
                <h4 class="story-name">{{ story.name }}</h4>
                <p class="story-meta">{{ story.location }} · {{ story.date }}</p>
              </div>
            </div>
            <p class="story-content">{{ story.content || story.story }}</p>
            <div class="story-tags" v-if="story.tags && story.tags.length > 0">
              <span 
                v-for="tag in story.tags" 
                :key="tag"
                class="story-tag"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加入同路人社群入口 -->
      <div class="community-section">
        <div class="community-card">
          <div class="community-icon">🔥</div>
          <h3 class="community-title">{{ transformationStageContent.communityTitle }}</h3>
          <p class="community-description">{{ transformationStageContent.communityDescription }}</p>
          <div class="community-actions">
            <a-button
              type="primary"
              size="large"
              class="share-story-btn"
              @click="shareStory"
            >
              <template #icon><thunderbolt-outlined /></template>
              🔆 点亮你的旅程
            </a-button>
          <a-button
            type="default"
            size="large"
            class="join-community-btn"
            @click="joinCommunity"
          >
            <template #icon><right-outlined /></template>
              🔥 加入篝火
          </a-button>
          </div>
        </div>
      </div>

      <!-- 尾声动画 -->
      <div class="transform-ending">
        <p class="ending-text">{{ transformationStageContent.endingText }}</p>
      </div>
    </div>
    <!-- 悬浮圆形按钮：旅程设计 -->
    <div v-if="healingDesign || (cognitiveTriggers && (cognitiveTriggers.questions?.length || cognitiveTriggers.rituals?.length || cognitiveTriggers.moments?.length))" class="floating-design-btn-wrapper">
      <!-- 悬浮圆形按钮 -->
      <button 
        class="floating-design-btn"
        :class="{ 'expanded': isDesignPanelOpen }"
        @click="toggleDesignPanel"
        :title="isDesignPanelOpen ? '收起' : '旅程设计'"
      >
        <span class="btn-icon">{{ isDesignPanelOpen ? '✕' : '🎨' }}</span>
      </button>
      
      <!-- 展开的面板 -->
      <transition name="panel-expand">
        <div v-if="isDesignPanelOpen" class="design-panel">
          <div class="panel-content">
            <h3 class="unified-section-title">旅程设计</h3>
            
            <!-- 治愈设计部分 -->
            <div v-if="healingDesign" class="healing-design-part">
              <h4 class="part-title">治愈设计</h4>
              <div class="healing-design-list">
                <div
                  v-for="item in healingItems"
                  :key="item.key"
                  class="healing-item is-collapsible"
                  :class="{ 'is-open': isItemOpen(item.key) }"
                >
                  <a-tooltip :title="item.title" placement="left">
                    <button
                      class="healing-icon-btn"
                      @click="toggleHealingItem(item.key)"
                      :aria-expanded="isItemOpen(item.key)"
                      :aria-controls="`healing-panel-${item.key}`"
                    >
                      <span class="healing-icon">{{ item.icon }}</span>
                    </button>
                  </a-tooltip>
                  <div
                    class="healing-content"
                    :id="`healing-panel-${item.key}`"
                    role="region"
                    :aria-hidden="!isItemOpen(item.key)"
                  >
                    <h5>{{ item.title }}</h5>
                    <transition name="collapse">
                      <p v-show="isItemOpen(item.key)">{{ item.text }}</p>
                    </transition>
                  </div>
                </div>
              </div>
            </div>

            <!-- 认知触发机制部分 -->
            <div v-if="cognitiveTriggers && (cognitiveTriggers.questions?.length || cognitiveTriggers.rituals?.length || cognitiveTriggers.moments?.length)" class="cognitive-triggers-part">
              <h4 class="part-title">认知触发</h4>
              <div class="triggers-content">
                <div v-if="cognitiveTriggers.questions && cognitiveTriggers.questions.length > 0" class="triggers-group">
                  <h5 class="triggers-group-title">💭 思考问题</h5>
                  <div class="triggers-list">
                    <div v-for="(question, index) in cognitiveTriggers.questions" :key="index" class="trigger-item">
                      {{ question }}
                    </div>
                  </div>
                </div>
                <div v-if="cognitiveTriggers.rituals && cognitiveTriggers.rituals.length > 0" class="triggers-group">
                  <h5 class="triggers-group-title">🕯️ 仪式与象征</h5>
                  <div class="triggers-list">
                    <div v-for="(ritual, index) in cognitiveTriggers.rituals" :key="index" class="trigger-item">
                      {{ ritual }}
                    </div>
                  </div>
                </div>
                <div v-if="cognitiveTriggers.moments && cognitiveTriggers.moments.length > 0" class="triggers-group">
                  <h5 class="triggers-group-title">✨ 契机时刻</h5>
                  <div class="triggers-list moments-tag-list">
                    <a-tag
                      v-for="(moment, index) in cognitiveTriggers.moments"
                      :key="index"
                      color="green"
                      class="moment-tag"
                    >
                      {{ moment }}
                    </a-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- 遮罩层（点击关闭） -->
      <transition name="fade">
        <div 
          v-if="isDesignPanelOpen" 
          class="design-panel-overlay"
          @click="closeDesignPanel"
        ></div>
      </transition>
    </div>

    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden-file-input"
      @change="handleFileSelect"
    />

    <!-- 反思模态框 - 认知闪光点 -->
    <a-modal
      v-model:open="reflectionModalVisible"
      :title="currentReflectionPillar ? `${currentReflectionPillar.title} - 深层反思` : '思考'"
      width="700px"
      :footer="null"
      :z-index="20001"
      :get-container="() => typeof document !== 'undefined' ? document.body : false"
      @cancel="closeReflectionModal"
    >
      <div class="reflection-modal-content" v-if="currentReflectionPillar">
        <div class="reflection-modal-icon">{{ currentReflectionPillar.icon }}</div>
        <h3 class="reflection-modal-question">{{ currentReflectionPillar.question }}</h3>
        <div class="reflection-modal-media" v-if="currentReflectionPillar.media">
          <img :src="currentReflectionPillar.media" alt="reflection" />
        </div>
        <div class="reflection-modal-text">
          <p>{{ currentReflectionPillar.reflection }}</p>
        </div>
        
        <!-- 用户回答输入区 -->
        <div class="reflection-modal-input-section">
          <p class="input-label">💭 写下你的思考</p>
          <a-textarea 
            v-model:value="currentUserReflection"
            :placeholder="`关于「${currentReflectionPillar.question}」，你有什么想法？`"
            :rows="6"
            :maxlength="1000"
            show-count
            class="reflection-textarea"
            allow-clear
          />
          
          <!-- 已保存的回答显示 -->
          <div v-if="getSavedReflection(currentReflectionPillar.id)" class="saved-reflection">
            <div class="saved-reflection-header">
              <span class="saved-icon">✨</span>
              <span class="saved-label">你之前写下的：</span>
            </div>
            <p class="saved-content">{{ getSavedReflection(currentReflectionPillar.id) }}</p>
          </div>
        </div>
        
        <div class="reflection-modal-hint">
          <p>💡 把答案写下来，让它成为你旅程的一部分。</p>
        </div>
        
        <!-- 操作按钮 -->
        <div class="reflection-modal-actions">
          <a-button 
            type="default" 
            @click="closeReflectionModal"
          >
            关闭
          </a-button>
          <a-button 
            type="primary" 
            :loading="isSavingReflection"
            @click="saveReflection"
            :disabled="!currentUserReflection.trim()"
          >
            <template #icon><check-outlined /></template>
            保存思考
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 图片上传/搜索模态框 -->
    <a-modal
      v-model:open="imageUploadModalVisible"
      title="添加图片"
      width="900px"
      :footer="null"
      :z-index="20000"
      :get-container="() => typeof document !== 'undefined' ? document.body : false"
      @cancel="closeImageUploadModal"
    >
      <a-tabs v-model:activeKey="uploadModalMode" @change="handleTabChange">
        <a-tab-pane key="upload" tab="本地上传">
          <div 
            class="modal-upload-zone"
            :class="{ 'drag-over': isDragging }"
            @drop.prevent="handleModalDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @click="fileInputRef?.click()"
          >
            <upload-outlined class="modal-upload-icon" />
            <p class="modal-upload-text">点击选择或拖拽图片到此处</p>
            <p class="modal-upload-hint">支持 JPG、PNG、GIF 格式，最多10张</p>
          </div>
        </a-tab-pane>
        <a-tab-pane key="search" tab="搜索图片">
          <div class="unsplash-search-section">
            <a-input-search
              v-model:value="unsplashSearchQuery"
              placeholder="搜索关键词，如：柏林、城市、建筑..."
              size="large"
              @search="handleUnsplashSearch"
              :loading="isSearching"
            >
              <template #enterButton>
                <a-button type="primary" :loading="isSearching">
                  <template #icon><search-outlined /></template>
                  搜索
                </a-button>
              </template>
            </a-input-search>

            <div v-if="isSearching" class="search-loading">
              <a-spin size="large" />
              <p>正在搜索图片...</p>
            </div>

            <div v-else-if="unsplashSearchResults.length > 0" class="unsplash-results">
              <div class="results-header">
                <span class="results-count">找到 {{ unsplashSearchResults.length }} 张图片</span>
                <a-button 
                  v-if="selectedUnsplashPhotos.length > 0"
                  type="primary"
                  size="small"
                  @click="addSelectedUnsplashPhotos"
                >
                  添加选中图片 ({{ selectedUnsplashPhotos.length }})
                </a-button>
              </div>
              <div class="unsplash-grid">
                <div
                  v-for="photo in unsplashSearchResults"
                  :key="photo.id"
                  class="unsplash-photo-item"
                  :class="{ 'selected': selectedUnsplashPhotos.includes(photo.id) }"
                  @click="togglePhotoSelection(photo.id)"
                >
                  <img :src="photo.urls.thumb" :alt="photo.description || 'Unsplash photo'" />
                  <div class="photo-overlay">
                    <div class="photo-info">
                      <p class="photo-author">{{ photo.user.name }}</p>
                    </div>
                    <div class="photo-checkbox" v-if="selectedUnsplashPhotos.includes(photo.id)">
                      <check-outlined />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="unsplashSearchQuery && !isSearching" class="search-empty">
              <picture-outlined class="empty-icon" />
              <p>未找到相关图片</p>
              <p class="empty-hint">试试其他关键词吧</p>
            </div>

            <div v-else class="search-placeholder">
              <search-outlined class="placeholder-icon" />
              <p>输入关键词搜索 Unsplash 图片库</p>
              <p class="placeholder-hint">例如：城市、自然、建筑、旅行...</p>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
    
    <!-- 🎯 底部：点亮你的旅程 -->
    <section class="journey-lightup-section">
      <div class="lightup-container">
        <h2 class="lightup-title">点亮你的旅程</h2>
        <p class="lightup-subtitle">将已完成/已收藏的动作生成路线 & 待办清单</p>
        <div class="lightup-stats">
          <div class="stat-item">
            <span class="stat-number">{{ completedCount }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalActions }}</span>
            <span class="stat-label">总动作</span>
          </div>
        </div>
        <div class="lightup-actions">
          <a-button type="primary" size="large" class="lightup-btn primary" @click="generateActionList">
            <template #icon><thunderbolt-outlined /></template>
            生成行动清单
          </a-button>
          <a-button size="large" class="lightup-btn secondary" @click="generateItinerary">
            <template #icon><rocket-outlined /></template>
            一键生成极简行程
          </a-button>
        </div>
        <div v-if="completedCount > 0" class="completed-summary">
          <h3>已完成动作预览</h3>
          <div class="completed-list">
            <div v-for="(key, idx) in Array.from(completedActions)" :key="idx" class="completed-item">
              {{ getActionName(key) }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useTravelListStore } from '@/stores/travelList'
import { playSound, SoundType } from '@/utils/audioFeedback'
import { generateFourPillars, generateAwakeningMoment, generateInternalizationTexts, generateTransformationContent } from '@/services/deepseekAPI'

// 注意：这些层级应该在 ExperienceDay.vue 内部实现，不应该是独立组件
// import MoodSpace from './components/MoodSpace.vue'
// import JourneyFlow from './components/JourneyFlow.vue'
// import CreativeZone from './components/CreativeZone.vue'
// import EchoOutro from './components/EchoOutro.vue'

// 导入图标
import { 
  EditOutlined, 
  CheckOutlined,
  CloseOutlined,
  PictureOutlined,
  SoundOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DeleteOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  CommentOutlined,
  SearchOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  BulbOutlined,
  FileOutlined,
  PlayCircleOutlined,
  PauseOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'

// 导入配置和工具函数
import { 
  poetryTemplates,
  aiFeedbackTemplates,
  summaryPoemTemplates,
  echoStatementTemplates,
  locationMoodMap,
  intentMoodMap,
  keywordIconMap,
  colorThemes,
  soundUrls as configSoundUrls
} from '@/config/inspirationConfig'
import { searchDestinationPhotos, translateDestination, type UnsplashPhoto } from '@/services/unsplashAPI'
import { fileToBase64, debounce } from '@/utils/helpers'
import { getIconByKeyword } from '@/utils/generateInspirationConfig'
import { generatePhotoPoetry, generatePoetryText, formatPoetryDisplay, type PoetryResult } from '@/utils/imagePoetryGenerator'
import { Modal, message } from 'ant-design-vue'
import { h } from 'vue'

const { t } = useI18n()
const route = useRoute()
const travelListStore = useTravelListStore()
const isInspirationTheme = computed(() => route.name?.toString().toLowerCase().includes('inspiration'));

// 响应式数据
const travel = computed(() => travelListStore.getTravel(route.params.id as string))

// ===== Hero区域：数据计算 =====
const heroTitle = computed(() => {
  return travel.value?.title || travel.value?.data?.title || '在镜中遇见自己'
})

// 五段心智流体验（从数据加载，提前定义供Hero使用）
const mentalFlowStages = computed(() => {
  return travel.value?.data?.mentalFlowStages
})

const heroAtmosphere = computed(() => {
  const stage = mentalFlowStages.value?.summon || mentalFlowStages.value?.reflection
  return stage?.symbolicElement || travel.value?.data?.atmosphere || 
    '在盐湖的镜面里，我听见时间在心跳间缓慢呼吸。'
})

const heroBackgroundStyle = computed(() => {
  const coverImage = travel.value?.coverImage || travel.value?.data?.coverImage
  if (coverImage) {
    return {
      backgroundImage: `url(${coverImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.85), rgba(56, 239, 125, 0.85))'
  }
})

const stageBreadcrumbs = [
  { key: 'summon', label: '剥离' },
  { key: 'reflection', label: '映照' },
  { key: 'awakening', label: '觉醒' },
  { key: 'internalization', label: '沉淀' },
  { key: 'transformation', label: '转化' }
]

const currentStageIndex = ref(0)

const generateItinerary = () => {
  message.info('正在生成行程...')
  // TODO: 实现生成行程逻辑
}

const addToCollection = () => {
  message.success('已加入灵感夹')
  // TODO: 实现加入收藏逻辑
}

// 监听滚动，更新当前阶段高亮
const updateCurrentStage = () => {
  const stages = stageBreadcrumbs.map(s => document.getElementById(`stage-${s.key}`))
  const scrollTop = window.scrollY + 200
  stages.forEach((el, idx) => {
    if (el && el.offsetTop <= scrollTop && (idx === stages.length - 1 || stages[idx + 1]?.offsetTop > scrollTop)) {
      currentStageIndex.value = idx
    }
  })
}

// ===== 动作完成状态管理 =====
const completedActions = ref<Set<string>>(new Set())

const completeAction = (stage: string, idx: number, activity: string) => {
  const key = `${stage}-${idx}`
  if (completedActions.value.has(key)) {
    completedActions.value.delete(key)
    message.info('已取消标记')
  } else {
    completedActions.value.add(key)
    playSound(SoundType.CLICK)
    message.success('✓ 已完成')
  }
  // 保存到 localStorage
  localStorage.setItem(`completedActions_${route.params.id}`, JSON.stringify(Array.from(completedActions.value)))
}

// ===== 动作解析函数（从AI内容智能提取） =====
const parseActivityIcon = (text: string): string => {
  const t = (text || '').toLowerCase()
  if (/静坐|冥想|meditat|breath|sit/.test(t)) return '🧘‍♀️'
  if (/交出|设备|手机|digital|offline/.test(t)) return '📵'
  if (/写下|标签|身份|write|tag/.test(t)) return '📝'
  if (/焚化|燃烧|burn/.test(t)) return '🔥'
  if (/徒步|行走|walk|hike/.test(t)) return '🚶'
  if (/盐湖|湖|lake|mirror/.test(t)) return '🌊'
  return '✨'
}

const parseActivityTitle = (text: string): string => {
  // 提取7字内的简短标题
  const cleaned = text.replace(/[⏱📍☁︎].*$/, '').trim()
  if (cleaned.length <= 7) return cleaned
  // 尝试截取到第一个标点或关键词
  const match = cleaned.match(/^([^，。：；,\.:;]{1,7})/)
  return match ? match[1] : cleaned.substring(0, 7) + '...'
}

const parseActivityBenefit = (text: string): string => {
  // 尝试提取收益描述（通常包含"让"、"感受"等关键词）
  const benefitMatch = text.match(/(?:让|感受|体验|获得|释放|放下)([^，。：；,\.:;]{2,20})/)
  return benefitMatch ? benefitMatch[1] : '让内心更平静'
}

const parseActivityMeta = (text: string): { duration?: string; mood?: string; location?: string } => {
  const meta: any = {}
  // 提取时长
  const durationMatch = text.match(/(\d+)[-–](\d+)\s*分钟|(\d+)\s*分钟|(\d+)[-–](\d+)\s*分/)
  if (durationMatch) meta.duration = durationMatch[1] ? `${durationMatch[1]}-${durationMatch[2]}分钟` : `${durationMatch[3] || durationMatch[4]}分钟`
  // 提取情绪标签
  if (/静心|静默|安静|calm|quiet/.test(text)) meta.mood = '☁︎ 静心'
  if (/放松|减压|relax/.test(text)) meta.mood = '☁︎ 放松'
  // 提取地点
  const locationMatch = text.match(/(?:在|到|于)([湖海边山顶]|湖边|湖边|山顶|海边|湖边|盐湖)/)
  if (locationMatch) meta.location = locationMatch[1]
  return meta
}

// ===== 阶段目标句（动词+收益） =====
const summonStageGoal = computed(() => {
  const stage = mentalFlowStages.value?.summon
  return stage?.emotionalGoal || '减压与清空 —— 让噪声离线'
})

const awakeningStageGoal = computed(() => {
  const stage = mentalFlowStages.value?.awakening
  return stage?.emotionalGoal || '唤起真实欲望 —— 向内说出答案'
})

const internalizationStageGoal = computed(() => {
  const stage = mentalFlowStages.value?.internalization
  return stage?.emotionalGoal || '在静默中生根 —— 写一封盐封的信'
})

const transformationStageGoal = computed(() => {
  const stage = mentalFlowStages.value?.transformation
  return stage?.emotionalGoal || '把感受变行动 —— 点亮一条可执行旅程'
})

// ===== 觉醒阶段卡片内容 =====
const awakeningStageCardContent = computed(() => {
  const stage = mentalFlowStages.value?.awakening as any
  if (!stage) return null as any
  return {
    title: stage?.theme || '觉醒',
    activities: Array.isArray(stage?.activities) ? stage.activities.slice(0, 5) : []
  }
})

// ===== 内化阶段：信件模板与状态 =====
const selectedCapsule = ref(0)
const selectedLetterTemplate = ref(0)
const letterContent = ref('')
const letterTemplates = [
  { label: '给过去的自己', placeholder: '写下你想对过去的自己说的话...' },
  { label: '给未来的自己', placeholder: '写下你想对未来自己说的话...' },
  { label: '给当下的自己', placeholder: '写下你想对当下自己说的话...' }
]

const estimateLetterTime = computed(() => {
  const words = letterContent.value.length
  return Math.ceil(words / 100) * 5 || 15
})

const saveLetterToCollection = () => {
  if (!letterContent.value.trim()) {
    message.warning('请先写下内容')
    return
  }
  message.success('已保存到灵感夹')
  // TODO: 实现保存逻辑
}

// ===== 底部"点亮旅程" =====
const completedCount = computed(() => completedActions.value.size)

const totalActions = computed(() => {
  const stages = ['summon', 'awakening', 'internalization', 'transformation']
  let total = 0
  stages.forEach(stage => {
    const stageData = (mentalFlowStages.value as any)?.[stage]
    if (stageData?.activities) total += Math.min(stageData.activities.length, 5)
  })
  return total || 0
})

const getActionName = (key: string): string => {
  const [stage, idx] = key.split('-')
  const stageData = (mentalFlowStages.value as any)?.[stage]
  if (stageData?.activities?.[parseInt(idx)]) {
    return parseActivityTitle(stageData.activities[parseInt(idx)])
  }
  return key
}

const generateActionList = () => {
  const completed = Array.from(completedActions.value).map(k => getActionName(k))
  if (completed.length === 0) {
    message.warning('请先完成一些动作')
    return
  }
  message.success(`已生成 ${completed.length} 项行动清单`)
  // TODO: 实现生成清单逻辑
}

// ===== 镜湖映心：三卡操作区 =====
const mirrorLakeActionCards = [
  {
    key: 'dawn-solitude',
    icon: '🌅',
    title: '黎明湖面独处',
    instruction: '5 分钟慢呼吸，收拢注意力',
    benefit: '把注意力从外界收回到身体',
    duration: '5分钟',
    location: '湖边',
    needsHeadphone: false,
    buttonText: '去独处'
  },
  {
    key: 'water-diary',
    icon: '📝',
    title: '水影日记书写',
    instruction: '写下3个感受+1个当下需求',
    benefit: '把情绪落地到文字里',
    duration: '10分钟',
    location: '湖边',
    needsHeadphone: false,
    buttonText: '去书写'
  },
  {
    key: 'pine-dialogue',
    icon: '🌲',
    title: '松涛下的自我对话',
    instruction: '用第二人称，大声说出一句承诺',
    benefit: '把真实需求说出口',
    duration: '8分钟',
    location: '松林',
    needsHeadphone: true,
    buttonText: '去表达'
  }
]

const completedMirrorActions = ref<Set<string>>(new Set())
const isRippleActive = ref<string | null>(null)
const hoveredCardIndex = ref<number | null>(null)

const handleCardHover = (idx: number) => {
  hoveredCardIndex.value = idx
}

const handleCardLeave = (idx: number) => {
  hoveredCardIndex.value = null
}

const handleCardClick = (card: typeof mirrorLakeActionCards[0]) => {
  // 卡片点击处理（如果需要）
}

const performAction = (card: typeof mirrorLakeActionCards[0]) => {
  isRippleActive.value = card.key
  setTimeout(() => {
    isRippleActive.value = null
  }, 600)
  
  if (completedMirrorActions.value.has(card.key)) {
    completedMirrorActions.value.delete(card.key)
    message.info('已取消标记')
  } else {
    completedMirrorActions.value.add(card.key)
    playSound(SoundType.CLICK)
    message.success('✓ 已完成')
    
    // 添加记录
    addFeelingRecord({
      type: 'text',
      content: `完成了「${card.title}」`,
      timestamp: new Date().toISOString()
    })
  }
  
  // 保存状态
  localStorage.setItem(`mirrorActions_${route.params.id}`, JSON.stringify(Array.from(completedMirrorActions.value)))
}

// ===== 声音控制 =====
const isLakeSoundOn = ref(false)
const lakeSoundAudio = ref<HTMLAudioElement | null>(null)

const toggleLakeSound = () => {
  isLakeSoundOn.value = !isLakeSoundOn.value
  if (isLakeSoundOn.value) {
    // TODO: 播放湖面白噪/风声
    message.info('声音已开启')
  } else {
    if (lakeSoundAudio.value) {
      lakeSoundAudio.value.pause()
    }
    message.info('已静音')
  }
}

// ===== 15分钟镜湖练习 =====
const startMirrorLakePractice = () => {
  message.info('开始15分钟镜湖练习...')
  // TODO: 实现引导式15分钟流（3步×5分钟，支持跳过）
}

// ===== 感受记录（时间线） =====
interface FeelingRecord {
  type: 'text' | 'audio' | 'image'
  content: string
  timestamp: string
  duration?: string
}

const allRecords = ref<FeelingRecord[]>([])
const activeRecordFilter = ref('all')
const recordFilters = [
  { key: 'all', label: '全部' },
  { key: 'audio', label: '音频' },
  { key: 'text', label: '文字' },
  { key: 'image', label: '图片' }
]

const todayRecords = computed(() => {
  const today = new Date().toDateString()
  return filteredRecords.value.filter(r => new Date(r.timestamp).toDateString() === today)
})

const historyRecords = computed(() => {
  const today = new Date().toDateString()
  return filteredRecords.value.filter(r => new Date(r.timestamp).toDateString() !== today)
})

const filteredRecords = computed(() => {
  if (activeRecordFilter.value === 'all') return allRecords.value
  return allRecords.value.filter(r => r.type === activeRecordFilter.value)
})

const addFeelingRecord = (record: FeelingRecord) => {
  allRecords.value.unshift(record)
  localStorage.setItem(`feelingRecords_${route.params.id}`, JSON.stringify(allRecords.value))
}

const formatRecordTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatRecordDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const exportToItinerary = () => {
  if (allRecords.value.length === 0) {
    message.warning('还没有记录')
    return
  }
  message.success('已导出到行程')
  // TODO: 实现导出逻辑
}

const todayCompletedCount = computed(() => {
  return completedMirrorActions.value.size
})

// 更新scrollToStage，支持跳转到感受记录，优化滚动锚点
const scrollToStage = (key: string) => {
  playSound(SoundType.CLICK)
  
  let targetElement: HTMLElement | null = null
  
  if (key === 'reflection') {
    targetElement = document.getElementById('feeling-records')
  } else {
    targetElement = document.getElementById(`stage-${key}`)
  }
  
  if (targetElement) {
    // 使用 scroll-margin-top，平滑滚动 280ms
    const offset = 80
    const y = targetElement.getBoundingClientRect().top + window.pageYOffset - offset
    
    // 检测是否支持平滑滚动
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ 
      top: y, 
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    })
    
    // 添加 scrolled-to 类，触发下划线动画
    nextTick(() => {
      targetElement?.classList.add('scrolled-to')
      setTimeout(() => {
        targetElement?.classList.remove('scrolled-to')
      }, 2000)
    })
  }
}
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImmersionMode = ref(false)
const activePeriod = ref<'morning' | 'afternoon' | 'evening' | null>(null)
const activeSound = ref<string | null>(null)
const currentAudio = ref<HTMLAudioElement | null>(null)
const isAIGenerating = ref(false)
const isDragging = ref(false)
const draggedIndex = ref<number | null>(null)
const userInspirationInput = ref('')
const aiFeedback = ref('')
const selectedTheme = ref('mixed')
const editingSummary = ref(false)
const editableSummary = ref('')
const editingActivity = ref<{ period: string, index: number } | null>(null)
const editableActivity = ref({ time: '', title: '', description: '' })
const uploadingIndex = ref<number>(-1)
const uploadingActivityPeriod = ref<'morning' | 'afternoon' | 'evening' | null>(null)
const uploadingActivityIndex = ref<number>(-1)
const moodboardRef = ref<HTMLElement | null>(null)
const activeCollage = ref<{ title: string; images: string[] } | null>(null)
// 滚动可见状态追踪
const visiblePoetryItems = ref<Set<number>>(new Set())
// 用户自定义的关键词标签（支持添加和图片上传）
const customMoodItems = ref<Array<{
  id: string
  icon: string
  text: string
  images: string[]
}>>([])
// 当前编辑的气泡索引（用于图片上传）
const editingBubbleId = ref<string | null>(null)
// 目的地卡片可见状态
const visibleDestinationCards = ref<Set<number>>(new Set())
// 图片上传/搜索模态框
const imageUploadModalVisible = ref(false)
const uploadModalMode = ref<'upload' | 'search'>('upload')
const unsplashSearchQuery = ref('')

// 治愈设计：悬浮提示 + 点击展开
const healingOpenSet = ref<Set<string>>(new Set())
const isItemOpen = (key: string) => healingOpenSet.value.has(key)
const toggleHealingItem = (key: string) => {
  if (healingOpenSet.value.has(key)) healingOpenSet.value.delete(key)
  else healingOpenSet.value.add(key)
}
const healingItems = computed(() => {
  if (!healingDesign.value) return [] as Array<{ key: string; title: string; icon: string; text: string }>
  const items: Array<{ key: string; title: string; icon: string; text: string }> = []
  const map: Record<string, { title: string; icon: string; text?: string }> = {
    sound: { title: '声音', icon: '🔊', text: healingDesign.value?.sound },
    scent: { title: '气味', icon: '🌸', text: healingDesign.value?.scent },
    light: { title: '光线', icon: '💡', text: healingDesign.value?.light },
    rhythm: { title: '节奏', icon: '🎵', text: healingDesign.value?.rhythm },
    community: { title: '社群', icon: '👥', text: healingDesign.value?.community }
  }
  for (const [key, v] of Object.entries(map)) {
    if (v.text) items.push({ key, title: v.title, icon: v.icon, text: v.text as string })
  }
  return items
})
const unsplashSearchResults = ref<UnsplashPhoto[]>([])
const isSearching = ref(false)
const selectedUnsplashPhotos = ref<string[]>([])
// 活动图片存储：{ 'morning-0': 'base64...', 'afternoon-1': 'base64...' }
const activityImages = ref<Record<string, { url: string }>>({})
// 用户上传的素材图片（包含AI生成的视觉诗）
const userMaterialImages = ref<Array<{
  url: string
  poetry: string
  tags: string[]
  isUserUpload: boolean
}>>([])

// 气泡展开状态
const expandedBubbleId = ref<string | null>(null)
const expandedBubbleData = ref<{ mood: any; index: number; position?: { x: number; y: number } } | null>(null)

// 已探索的节点（用于轨迹线）
const exploredNodes = ref<Set<string>>(new Set())

// ② 映照阶段状态
const reflectionStageRef = ref<HTMLElement | null>(null)
const cardsContainerRef = ref<HTMLElement | null>(null)
const backgroundSoundRef = ref<HTMLElement | null>(null)
const selectedReflectionIndex = ref<number | null>(null)
const focusedCardIndex = ref<number | null>(null)
const backgroundSoundAudio = ref<HTMLAudioElement | null>(null)

// ② 映照阶段：生成情绪识别语卡片（从数据中提取，优先使用mentalFlowStages.reflection.activities）
const emotionReflections = computed(() => {
  const reflections: Array<{
    text: string
    emotion: string
    emotionIcon: string
    intensity: number
  }> = []
  
  // 1. 优先从 mentalFlowStages.reflection.activities 中获取（这是最相关的数据源）
  const reflectionStage = mentalFlowStages.value?.reflection
  if (reflectionStage?.activities && Array.isArray(reflectionStage.activities) && reflectionStage.activities.length > 0) {
    const emotionTone = travel.value?.data?.detectedIntent?.emotionTone || '平静'
    return reflectionStage.activities.map((activity: string, index: number) => ({
      text: activity,
      emotion: emotionTone,
      emotionIcon: getEmotionIcon(emotionTone),
      intensity: 0.5 + (index * 0.12) // 强度递增
    }))
  }
  
  // 2. 从 travel.data.emotionReflections 中获取（如果AI已生成）
  if (travel.value?.data?.emotionReflections && Array.isArray(travel.value.data.emotionReflections)) {
    return travel.value.data.emotionReflections.map((r: any) => ({
      text: r.text || '',
      emotion: r.emotion || '平静',
      emotionIcon: getEmotionIcon(r.emotion || '平静'),
      intensity: r.intensity || 0.6
    }))
  }
  
  // 3. 从 detectedIntent 中生成（仅作为后备方案）
  const intentType = travel.value?.data?.detectedIntent?.intentType
  const emotionTone = travel.value?.data?.detectedIntent?.emotionTone || '平静'
  
  // 通用模板（作为最后的后备）
  const templates = [
    '你有多久，没有静静地发呆？',
    '你是否也在努力成为别人期待的样子？',
    '你还记得，上一次被理解是什么时候？',
    '你是否也在等待，一场与自己重逢的旅程？'
  ]
  
  // 生成3-5张卡片
  templates.slice(0, 4).forEach((template, index) => {
    reflections.push({
      text: template,
      emotion: emotionTone,
      emotionIcon: getEmotionIcon(emotionTone),
      intensity: 0.5 + (index * 0.15) // 强度递增
    })
  })
  
  return reflections
})

// 根据情绪类型获取图标
const getEmotionIcon = (emotion: string): string => {
  const iconMap: Record<string, string> = {
    '平静': '🌊',
    '活力': '✨',
    '沉思': '💭',
    '冒险': '⛰️',
    '疗愈': '🕊️',
    '创意': '🎨',
    '专注': '🔍',
    '温柔': '🌸'
  }
  
  // 如果情绪包含关键词，返回对应图标
  for (const [key, icon] of Object.entries(iconMap)) {
    if (emotion.includes(key)) {
      return icon
    }
  }
  
  return '💭' // 默认图标
}

// 映照阶段：镜子卡片数据（从reflection.activities获取或使用默认）
const reflectionMirrorCards = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  const activities = (stage?.activities || []).filter((a: any) => typeof a === 'string' && a.trim().length > 0)
  const tone = travel.value?.data?.detectedIntent?.emotionTone || '平静'
  
  const baseRgb = (type: 'tundra' | 'volcano' | 'aurora'): [number, number, number] => {
    if (type === 'volcano') return [255, 99, 71] // tomato
    if (type === 'aurora') return [56, 189, 248] // sky-400
    return [56, 239, 125] // green
  }
  const makeBg = (type: 'tundra' | 'volcano' | 'aurora', intensity = 0.6) => {
    const [r, g, b] = baseRgb(type)
    const a1 = Math.min(0.08 + intensity * 0.08, 0.22)
    const a2 = Math.min(0.14 + intensity * 0.12, 0.32)
    return `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, ${a1}), rgba(${r}, ${g}, ${b}, ${a2}))`
  }
  const rgbString = (type: 'tundra' | 'volcano' | 'aurora') => baseRgb(type).join(', ')
  
  // 1) 优先使用情绪识别语（包含图标与强度）
  const emotionCards = (emotionReflections.value || []).slice(0, 3).map((r: any, idx: number) => {
    const inferredType: 'tundra' | 'volcano' | 'aurora' = idx % 3 === 1 ? 'volcano' : (idx % 3 === 2 ? 'aurora' : 'tundra')
    const intensity = typeof r.intensity === 'number' ? r.intensity : 0.6
    return {
      text: r.text,
      emotionIcon: r.emotionIcon || getEmotionIcon(tone),
      type: inferredType,
      emotion: r.emotion || tone,
      intensity,
      bg: makeBg(inferredType, intensity),
      colorRgb: rgbString(inferredType)
    }
  })
  if (emotionCards.length > 0) return emotionCards

  // 2) 其次使用 activities 文本，并根据语义估计类型和图标
  const getCardType = (text: string): 'tundra' | 'volcano' | 'aurora' => {
    if (text.match(/苔原|极昼|午夜|冰雪|冰川|雪原|极地|寒冷|空旷|寂静/i)) return 'tundra'
    if (text.match(/火山|石头|岩石|熔岩|炽热|燃烧|梦境|刻字|雕刻/i)) return 'volcano'
    if (text.match(/极光|光|轨迹|天空|星空|夜晚|闪耀|光芒|指引/i)) return 'aurora'
    const types: Array<'tundra' | 'volcano' | 'aurora'> = ['tundra', 'volcano', 'aurora']
    return types[Math.floor(Math.random() * types.length)]
  }

  if (activities.length > 0) {
    return activities.slice(0, 3).map((text: string, idx: number) => {
      const t = getCardType(text)
      const intensity = 0.55 + idx * 0.1
      return { text, emotionIcon: getEmotionIcon(tone), type: t, emotion: tone, intensity, bg: makeBg(t, intensity), colorRgb: rgbString(t) }
    })
  }

  // 3) 兜底：静态占位文本
  const placeholders = ['你有多久没有好好与自己说话？', '你还记得，内心的安静是什么感觉？', '如果此刻能拥抱一件事，会是什么？']
  return placeholders.map((text, idx) => {
    const t: 'tundra' | 'volcano' | 'aurora' = idx % 3 === 1 ? 'volcano' : (idx % 3 === 2 ? 'aurora' : 'tundra')
    const intensity = 0.6
    return { text, emotionIcon: getEmotionIcon(tone), type: t, emotion: tone, intensity, bg: makeBg(t, intensity), colorRgb: rgbString(t) }
  })
})

// 映照阶段状态
const isPageReady = ref(false)
const activeSceneType = ref<'tundra' | 'volcano' | 'aurora' | null>(null)
const selectedMirrorCardIndex = ref<number | null>(null)
const isMirrorClosed = ref(false)
const isReflectionRecorded = ref(false)

// 场景问题（从数据获取）
const sceneQuestion = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  const cognitiveTriggers = travel.value?.data?.cognitiveTriggers
  
  // 优先使用认知触发的问题，其次使用stage的symbolicElement
  if (cognitiveTriggers?.questions && cognitiveTriggers.questions.length > 0) {
    // 根据场景类型选择对应的问题（如果有多余的问题）
    const index = selectedMirrorCardIndex.value || 0
    return cognitiveTriggers.questions[index] || cognitiveTriggers.questions[0] || ''
  }
  
  return stage?.symbolicElement || ''
})

// 石头刻字占位符
const stonePlaceholder = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  return stage?.activities?.[0] || ''
})

// 苔原场景状态
const showFootprints = ref(false)
const footprintSteps = ref<Array<{ style: string }>>([])

// 火山场景状态
const showStoneWriting = ref(false)
const stoneDreamText = ref('')

// 极光场景状态
const auroraLights = ref<Array<{ style: string }>>([])
const auroraResponse = ref('')
const auroraLightsRef = ref<HTMLElement | null>(null)

// 感受记录状态
const reflectionRecord = ref('')
const savedReflectionCard = ref('')

// 感受记录占位符
const reflectionRecordPlaceholder = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  return stage?.activities?.[0] || ''
})

// 镜子关闭消息
const mirrorCloseMessage = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  return stage?.theme || ''
})

const mirrorCloseSubmessage = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  return stage?.symbolicElement || ''
})

// 初始化页面
watch(() => reflectionStageRef.value, (el) => {
  if (el) {
    setTimeout(() => {
      isPageReady.value = true
    }, 500)
  }
}, { immediate: true })

// 进入镜子场景
const enterMirrorScene = (card: { text: string; type: string }, index: number) => {
  playSound(SoundType.CLICK)
  selectedMirrorCardIndex.value = index
  activeSceneType.value = card.type as 'tundra' | 'volcano' | 'aurora'
  
  // 根据不同场景触发相应动画
  if (card.type === 'tundra') {
    // 苔原场景：显示脚印轨迹
    setTimeout(() => {
      showFootprints.value = true
      createFootprintTrail()
    }, 1000)
  } else if (card.type === 'volcano') {
    // 火山场景：显示书写区域
    setTimeout(() => {
      showStoneWriting.value = true
    }, 1000)
  } else if (card.type === 'aurora') {
    // 极光场景：创建极光动画
    setTimeout(() => {
      createAuroraLights()
      // 3秒后生成回应
      setTimeout(() => {
        generateAuroraResponse()
      }, 3000)
    }, 500)
  }
}

// 创建脚印轨迹动画
const createFootprintTrail = () => {
  const steps = []
  for (let i = 0; i < 8; i++) {
    const x = 30 + (i * 8)
    const y = 50 + Math.sin(i * 0.5) * 10
    const delay = i * 0.3
    steps.push({
      style: `left: ${x}%; top: ${y}%; animation-delay: ${delay}s; opacity: ${1 - i * 0.1}`
    })
  }
  footprintSteps.value = steps
}

// 创建极光动画
const createAuroraLights = () => {
  const lights = []
  for (let i = 0; i < 5; i++) {
    const hue = 180 + (i * 10)
    const x = 20 + (i * 15)
    const y = 30 + Math.sin(i) * 10
    lights.push({
      style: `left: ${x}%; top: ${y}%; background: linear-gradient(to bottom, hsla(${hue}, 70%, 60%, 0.6), transparent); animation-delay: ${i * 0.2}s`
    })
  }
  auroraLights.value = lights
}

// 生成极光回应（从AI数据获取）
const generateAuroraResponse = () => {
  const stage = mentalFlowStages.value?.reflection
  if (stage?.symbolicElement) {
    auroraResponse.value = stage.symbolicElement
  }
  // 如果没有数据，不显示回应
}

// 在石头上刻字
const engraveOnStone = () => {
  if (stoneDreamText.value.trim()) {
    playSound(SoundType.CLICK)
    // 保存刻字内容
    message.success('已保存')
  }
}

// 退出场景
const exitMirrorScene = () => {
  playSound(SoundType.CLICK)
  activeSceneType.value = null
  showFootprints.value = false
  footprintSteps.value = []
  showStoneWriting.value = false
  stoneDreamText.value = ''
  auroraLights.value = []
  auroraResponse.value = ''
}

// 保存感受记录
const saveReflectionRecord = () => {
  if (!reflectionRecord.value.trim()) {
    message.warning('请先写下你的感受')
    return
  }
  
  playSound(SoundType.CLICK)
  
  // 保存到localStorage和travel数据
  const recordData = {
    text: reflectionRecord.value,
    cardIndex: selectedMirrorCardIndex.value,
    cardType: reflectionMirrorCards.value[selectedMirrorCardIndex.value!]?.type,
    timestamp: new Date().toISOString()
  }
  
  const savedRecords = JSON.parse(localStorage.getItem('reflectionRecords') || '[]')
  savedRecords.push({
    travelId: route.params.id,
    ...recordData
  })
  localStorage.setItem('reflectionRecords', JSON.stringify(savedRecords))
  
  // 保存到travel数据
  if (travel.value && travelListStore) {
    const updatedTravel = {
      ...travel.value,
      data: {
        ...travel.value.data,
        reflectionRecord: recordData
      }
    }
    travelListStore.updateTravel(travel.value.id, updatedTravel)
  }
  
  // 生成语录卡
  savedReflectionCard.value = reflectionRecord.value
  
  isReflectionRecorded.value = true
  
  // 延迟播放合镜动画
  setTimeout(() => {
    isMirrorClosed.value = true
    message.success('你的感受已保存')
  }, 2000)
}

// 触摸事件处理（用于移动端）
const touchStartTime = ref<number>(0)
const touchStartIndex = ref<number | null>(null)
const touchStartPillarId = ref<string | null>(null)
const touchStartDestinationCard = ref<any>(null)

// 反射卡片触摸事件
const handleCardTouchStart = (index: number) => {
  touchStartTime.value = Date.now()
  touchStartIndex.value = index
}

const handleCardTouchEnd = (index: number) => {
  if (touchStartIndex.value === index && Date.now() - touchStartTime.value < 300) {
    // 快速触摸（类似点击）
    selectReflection(index)
  }
  touchStartIndex.value = null
}

// 目的地卡片触摸事件
const handleDestinationCardTouchStart = (card: any, index: number) => {
  touchStartTime.value = Date.now()
  touchStartDestinationCard.value = { card, index }
}

const handleDestinationCardTouchEnd = (card: any, index: number) => {
  if (touchStartDestinationCard.value && 
      touchStartDestinationCard.value.index === index && 
      Date.now() - touchStartTime.value < 300) {
    // 快速触摸（类似点击）
    handleDestinationCardClick(card)
  }
  touchStartDestinationCard.value = null
}

// 支柱卡片触摸事件
const handlePillarTouchStart = (pillarId: string) => {
  touchStartTime.value = Date.now()
  touchStartPillarId.value = pillarId
}
const handlePillarTouchEnd = (pillarId: string) => {
  if (touchStartPillarId.value === pillarId && Date.now() - touchStartTime.value < 300) {
    // 快速触摸（类似点击）
    togglePillarExpansion(pillarId)
  }
  touchStartPillarId.value = null
}
// 选择情绪识别语
const selectReflection = (index: number) => {
  console.log('点击卡片:', index) // 调试日志
  selectedReflectionIndex.value = index
  playSound(SoundType.CLICK)
  
  // 播放轻柔的背景声（心跳/呼吸音）
  playBackgroundSound()
  
  // 平滑滚动到选择区域中心
  nextTick(() => {
    if (reflectionStageRef.value) {
      reflectionStageRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// 播放背景声
const playBackgroundSound = () => {
  // 停止之前的背景声
  if (backgroundSoundAudio.value) {
    backgroundSoundAudio.value.pause()
    backgroundSoundAudio.value = null
  }
  
  // 可以添加实际的心跳/呼吸音效URL
  // 这里使用一个轻柔的环境音（如果有配置）
  // const soundUrl = configSoundUrls.ambient || 'https://example.com/heartbeat.mp3'
  // const audio = new Audio(soundUrl)
  // audio.loop = true
  // audio.volume = 0.3
  // audio.play().catch(() => {})
  // backgroundSoundAudio.value = audio
}

// 进入对话阶段
const proceedToDialogueStage = () => {
  // 停止背景声
  if (backgroundSoundAudio.value) {
    backgroundSoundAudio.value.pause()
    backgroundSoundAudio.value = null
  }
  
  playSound(SoundType.CLICK)
  
  // 平滑滚动到下一阶段（对话阶段）
  nextTick(() => {
    const dialogueStage = document.querySelector('.dialogue-stage')
    if (dialogueStage) {
      dialogueStage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// ③ 对话阶段状态
const dialogueStageRef = ref<HTMLElement | null>(null)
const expandedPillarId = ref<string | null>(null)
const completedPillars = ref<Set<string>>(new Set())
const reflectionModalVisible = ref(false)
const currentReflectionPillar = ref<any>(null)
const currentUserReflection = ref<string>('')
const isSavingReflection = ref(false)
const userReflections = ref<Record<string, string>>({}) // 存储每个支柱的回答 { pillarId: answer }
const isGeneratingPillars = ref(false)
const generatedPillars = ref<any>(null) // 存储AI生成的内容

// 🌠 觉醒的巅峰状态
const awakeningPeakStageRef = ref<HTMLElement | null>(null)
const awakeningSoundRef = ref<HTMLElement | null>(null)
const isAwakeningPeakActive = ref(false)
const showAwakeningText = ref(false)
const showEntranceButton = ref(false)
const awakeningMomentText = ref('')
const awakeningEntranceText = ref('')
const awakeningAudio = ref<HTMLAudioElement | null>(null)
const heartbeatAudio = ref<HTMLAudioElement | null>(null)

// 生成四大支柱（AI生成）
const generatePillarsWithAI = async () => {
  if (!travel.value || isGeneratingPillars.value) return
  
  // 如果已有数据，不重复生成
  if (travel.value.data?.fourPillars) {
    generatedPillars.value = travel.value.data.fourPillars
    return
  }
  
  const intentData = travel.value.data?.detectedIntent || {
    intentType: 'photography_exploration',
    emotionTone: '平静'
  }
  const userInput = travel.value.data?.inspirationInput || travel.value.data?.userInput
  const destination = selectedLocationName.value || travel.value.data?.destination
  
  isGeneratingPillars.value = true
  
  try {
    const language = (() => {
      const locale = (t as any).locale?.value || (window as any).__VUE_I18N__?.global?.locale?.value || 'zh-CN'
      return locale
    })()
    
    const pillarsData = await generateFourPillars(
      intentData,
      userInput,
      destination,
      language
    )
    
    generatedPillars.value = pillarsData
    
    // 保存到travel数据
    if (travel.value && travelListStore) {
      const updatedTravel = {
        ...travel.value,
        data: {
          ...travel.value.data,
          fourPillars: pillarsData
        }
      }
      travelListStore.updateTravel(travel.value.id, updatedTravel)
    }
    
    console.log('✅ 四大支柱AI生成成功:', pillarsData)
  } catch (error) {
    console.error('生成四大支柱失败:', error)
    message.warning('生成思考问题失败，使用默认内容')
    // 生成失败时使用后备值（已由AI函数处理）
  } finally {
    isGeneratingPillars.value = false
  }
}

// ③ 对话阶段：四大支柱模块（优先使用认知触发的questions，其次AI生成）
const fourPillars = computed(() => {
  // 获取认知触发的思考问题
  const cognitiveQuestions = cognitiveTriggers.value?.questions || []
  
  // 1. 优先从 travel.data.fourPillars 中获取（如果AI已生成）
  const pillarsData = travel.value?.data?.fourPillars || generatedPillars.value
  
  if (pillarsData) {
    // 优先使用认知触发的问题，如果没有则使用fourPillars的问题
    return [
      {
        id: 'departure',
        icon: '🚶',
        title: '脱离',
        question: cognitiveQuestions[0] || pillarsData.departure?.question || '',
        reflection: pillarsData.departure?.reflection || '',
        media: pillarsData.departure?.media,
        ritual: cognitiveTriggers.value?.rituals?.[0] || '' // 仪式与象征
      },
      {
        id: 'context',
        icon: '🌍',
        title: '情境',
        question: cognitiveQuestions[1] || pillarsData.context?.question || '',
        reflection: pillarsData.context?.reflection || '',
        media: pillarsData.context?.media,
        ritual: cognitiveTriggers.value?.rituals?.[1] || ''
      },
      {
        id: 'internalization',
        icon: '💭',
        title: '内化',
        question: cognitiveQuestions[2] || pillarsData.internalization?.question || '',
        reflection: pillarsData.internalization?.reflection || '',
        media: pillarsData.internalization?.media,
        moment: cognitiveTriggers.value?.moments?.[0] || '' // 契机时刻
      },
      {
        id: 'transformation',
        icon: '✨',
        title: '转化',
        question: cognitiveQuestions[3] || pillarsData.transformation?.question || '',
        reflection: pillarsData.transformation?.reflection || '',
        media: pillarsData.transformation?.media,
        moment: cognitiveTriggers.value?.moments?.[1] || ''
      }
    ]
  }
  
  // 2. 如果只有认知触发的问题，使用它们来构建支柱
  if (cognitiveQuestions.length > 0) {
    return [
      {
        id: 'departure',
        icon: '🚶',
        title: '脱离',
        question: cognitiveQuestions[0] || '',
        reflection: '',
        media: undefined,
        ritual: cognitiveTriggers.value?.rituals?.[0] || ''
      },
      {
        id: 'context',
        icon: '🌍',
        title: '情境',
        question: cognitiveQuestions[1] || cognitiveQuestions[0] || '',
        reflection: '',
        media: undefined,
        ritual: cognitiveTriggers.value?.rituals?.[1] || ''
      },
      {
        id: 'internalization',
        icon: '💭',
        title: '内化',
        question: cognitiveQuestions[2] || cognitiveQuestions[0] || '',
        reflection: '',
        media: undefined,
        moment: cognitiveTriggers.value?.moments?.[0] || ''
      },
      {
        id: 'transformation',
        icon: '✨',
        title: '转化',
        question: cognitiveQuestions[3] || cognitiveQuestions[0] || '',
        reflection: '',
        media: undefined,
        moment: cognitiveTriggers.value?.moments?.[1] || ''
      }
    ]
  }
  
  // 3. 如果没有数据，触发AI生成
  if (travel.value && !isGeneratingPillars.value) {
    nextTick(() => {
      generatePillarsWithAI()
    })
  }
  
  // 返回临时结构，显示加载状态
  return [
    {
      id: 'departure',
      icon: '🚶',
      title: '脱离',
      question: '',
      reflection: '',
      media: undefined,
      ritual: ''
    },
    {
      id: 'context',
      icon: '🌍',
      title: '情境',
      question: '',
      reflection: '',
      media: undefined,
      ritual: ''
    },
    {
      id: 'internalization',
      icon: '💭',
      title: '内化',
      question: '',
      reflection: '',
      media: undefined,
      moment: ''
    },
    {
      id: 'transformation',
      icon: '✨',
      title: '转化',
      question: '',
      reflection: '',
      media: undefined,
      moment: ''
    }
  ]
})

// 切换支柱展开状态
const togglePillarExpansion = (pillarId: string) => {
  console.log('点击支柱卡片:', pillarId) // 调试日志
  if (expandedPillarId.value === pillarId) {
    expandedPillarId.value = null
  } else {
    expandedPillarId.value = pillarId
    completedPillars.value.add(pillarId)
    playSound(SoundType.CLICK)
  }
}

// 打开反思模态框
const openReflectionModal = (pillar: any) => {
  currentReflectionPillar.value = pillar
  // 加载已保存的回答
  currentUserReflection.value = userReflections.value[pillar.id] || ''
  reflectionModalVisible.value = true
  completedPillars.value.add(pillar.id)
  playSound(SoundType.CLICK)
}

// 关闭反思模态框
const closeReflectionModal = () => {
  reflectionModalVisible.value = false
  // 不清空输入，保留用户输入的内容
  playSound(SoundType.CLICK)
}

// 保存用户反思
const saveReflection = async () => {
  if (!currentReflectionPillar.value || !currentUserReflection.value.trim()) {
    message.warning('请先写下一些思考')
    return
  }
  
  isSavingReflection.value = true
  playSound(SoundType.CLICK)
  
  try {
    const pillarId = currentReflectionPillar.value.id
    const reflectionContent = currentUserReflection.value.trim()
    
    // 保存到本地状态
    userReflections.value[pillarId] = reflectionContent
    
    // 保存到 localStorage
    const travelId = route.params.id as string
    const storageKey = `travelReflections_${travelId}`
    localStorage.setItem(storageKey, JSON.stringify(userReflections.value))
    
    // 也可以保存到 travel 数据中
    if (travel.value && travelListStore) {
      // 这里可以调用 API 保存到后端
      // await saveTravelReflection(travelId, pillarId, reflectionContent)
    }
    
    message.success('思考已保存 ✨')
    
    // 延迟关闭模态框，让用户看到成功提示
    setTimeout(() => {
      closeReflectionModal()
      isSavingReflection.value = false
    }, 500)
    
  } catch (error) {
    console.error('保存反思失败:', error)
    message.error('保存失败，请稍后再试')
    isSavingReflection.value = false
  }
}

// 获取已保存的反思
const getSavedReflection = (pillarId: string): string | null => {
  return userReflections.value[pillarId] || null
}

// 生成觉醒时刻文案（AI生成）
const generateAwakeningMomentText = async () => {
  if (awakeningMomentText.value && awakeningEntranceText.value) {
    return // 已有内容，不重复生成
  }
  
  const intentData = travel.value?.data?.detectedIntent || {
    intentType: 'photography_exploration',
    emotionTone: '平静'
  }
  const userInput = travel.value?.data?.inspirationInput || travel.value?.data?.userInput
  const destination = selectedLocationName.value || travel.value?.data?.destination
  
  try {
    const language = (() => {
      const locale = (t as any).locale?.value || (window as any).__VUE_I18N__?.global?.locale?.value || 'zh-CN'
      return locale
    })()
    
    const result = await generateAwakeningMoment(
      intentData,
      userInput,
      destination,
      language
    )
    
    awakeningMomentText.value = result.awakeningText
    awakeningEntranceText.value = result.entranceText
    
    // 保存到travel数据
    if (travel.value && travelListStore) {
      const updatedTravel = {
        ...travel.value,
        data: {
          ...travel.value.data,
          awakeningMoment: result
        }
      }
      travelListStore.updateTravel(travel.value.id, updatedTravel)
    }
    
    console.log('✅ 觉醒时刻AI生成成功:', result)
  } catch (error) {
    console.error('生成觉醒时刻失败:', error)
    // 使用默认值
    awakeningMomentText.value = '此刻，你不需要找到答案。你只需要，听见自己。'
    awakeningEntranceText.value = '写信给未来的自己'
  }
}

// 激活觉醒的巅峰
const activateAwakeningPeak = async () => {
  if (isAwakeningPeakActive.value) return
  
  // 生成文案（如果还没有）
  if (!awakeningMomentText.value) {
    await generateAwakeningMomentText()
  } else {
    // 从travel数据加载
    const saved = travel.value?.data?.awakeningMoment
    if (saved) {
      awakeningMomentText.value = saved.awakeningText
      awakeningEntranceText.value = saved.entranceText
    }
  }
  
  isAwakeningPeakActive.value = true
  
  // 停止所有背景声音
  if (backgroundSoundAudio.value) {
    backgroundSoundAudio.value.pause()
    backgroundSoundAudio.value = null
  }
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }
  
  // 锁定滚动
  document.body.style.overflow = 'hidden'
  
  // 播放心跳声和钢琴音（如果可以配置）
  // 这里可以添加实际音频文件的播放逻辑
  
  // 延迟显示文字
  setTimeout(() => {
    showAwakeningText.value = true
  }, 1000)
  
  // 延迟显示入口按钮
  setTimeout(() => {
    showEntranceButton.value = true
  }, 4000)
}

// 进入内化阶段
const enterInternalizationStage = () => {
  playSound(SoundType.CLICK)
  
  // 恢复滚动
  document.body.style.overflow = ''
  
  // 停止觉醒时刻音频
  if (awakeningAudio.value) {
    awakeningAudio.value.pause()
    awakeningAudio.value = null
  }
  if (heartbeatAudio.value) {
    heartbeatAudio.value.pause()
    heartbeatAudio.value = null
  }
  
  // 平滑滚动到内化阶段
  nextTick(() => {
    const internalizationStage = document.querySelector('.internalization-stage')
    if (internalizationStage) {
      internalizationStage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 进入内化阶段（从对话阶段按钮触发）
const proceedToInternalizationStage = () => {
  playSound(SoundType.CLICK)
  
  // 滚动到觉醒的巅峰，然后自动激活
  nextTick(() => {
    const awakeningStage = document.querySelector('.awakening-peak-stage')
    if (awakeningStage) {
      awakeningStage.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 观察器会在滚动到位置时自动触发激活
    }
  })
}

// ④ 内化阶段状态
const internalizationStageRef = ref<HTMLElement | null>(null)
const internalizationBackgroundRef = ref<HTMLElement | null>(null)
const letterToFuture = ref('')
const isSavingLetter = ref(false)
const isLetterSaved = ref(false)
const showLetterEnvelope = ref(true) // 控制信封显示
const isLetterSealed = ref(false) // 控制盖章状态

// 内化阶段文案（AI生成）
const internalizationTexts = ref({
  stageTitle: '',
  stageSubtitle: '',
  letterTitle: '',
  letterHint: '',
  placeholder: '',
  saveButtonText: '',
  savedMessage: '',
  continueButtonText: ''
})

// 生成内化阶段文案（AI生成）
const generateInternalizationTexts = async () => {
  // 如果已有数据，不重复生成
  if (internalizationTexts.value.stageTitle) {
    return
  }
  
  // 从travel数据加载
  const saved = travel.value?.data?.internalizationTexts
  if (saved) {
    internalizationTexts.value = saved
    return
  }
  
  const intentData = travel.value?.data?.detectedIntent || {
    intentType: 'photography_exploration',
    emotionTone: '平静'
  }
  const userInput = travel.value?.data?.inspirationInput || travel.value?.data?.userInput
  const destination = selectedLocationName.value || travel.value?.data?.destination
  
  try {
    const language = (() => {
      const locale = (t as any).locale?.value || (window as any).__VUE_I18N__?.global?.locale?.value || 'zh-CN'
      return locale
    })()
    
    const result = await generateInternalizationTexts(
      intentData,
      userInput,
      destination,
      language
    )
    
    internalizationTexts.value = result
    
    // 保存到travel数据
    if (travel.value && travelListStore) {
      const updatedTravel = {
        ...travel.value,
        data: {
          ...travel.value.data,
          internalizationTexts: result
        }
      }
      travelListStore.updateTravel(travel.value.id, updatedTravel)
    }
    
    console.log('✅ 内化阶段文案AI生成成功:', result)
  } catch (error) {
    console.error('生成内化阶段文案失败:', error)
    // 不设置默认值，保持为空
    internalizationTexts.value = {
      stageTitle: '',
      stageSubtitle: '',
      letterTitle: '',
      letterHint: '',
      placeholder: '',
      saveButtonText: '',
      savedMessage: '',
      continueButtonText: ''
    }
  }
}

// 保存信件给未来自己（带信封动画）
const saveLetterToFuture = async () => {
  if (!letterToFuture.value.trim()) {
    message.warning('请先写下一些内容')
    return
  }
  
  isSavingLetter.value = true
  playSound(SoundType.CLICK)
  
  try {
    // 第一步：隐藏输入区域，开始收起动画
    setTimeout(() => {
      showLetterEnvelope.value = false
    }, 300)
    
    // 第二步：等待收起动画完成，然后开始盖章动画
    setTimeout(async () => {
    // 保存到 localStorage（匿名保存）
    const letterData = {
      content: letterToFuture.value,
      timestamp: new Date().toISOString(),
      travelId: route.params.id as string
    }
    const savedLetters = JSON.parse(localStorage.getItem('lettersToFuture') || '[]')
    savedLetters.push(letterData)
    localStorage.setItem('lettersToFuture', JSON.stringify(savedLetters))
    
    // 也可以保存到 travel 数据中
      if (travel.value && travelListStore) {
        const updatedTravel = {
          ...travel.value,
          data: {
            ...travel.value.data,
            letterToFuture: letterToFuture.value
          }
        }
        travelListStore.updateTravel(travel.value.id, updatedTravel)
      }
      
      // 显示盖章效果
      isLetterSealed.value = true
    isLetterSaved.value = true
      
      message.success(internalizationTexts.value.savedMessage || '已保存')
      
      // 播放盖章音效（如果有）
      playSound(SoundType.CLICK)
      
    }, 1000) // 等待1秒让收起动画完成
    
  } catch (error) {
    console.error('保存信件失败:', error)
    message.error('保存失败，请重试')
    isSavingLetter.value = false
    showLetterEnvelope.value = true
  }
}

// 重新编辑信件（取消盖章）
const editLetterAgain = () => {
  isLetterSealed.value = false
  isLetterSaved.value = false
  showLetterEnvelope.value = true
  isSavingLetter.value = false
}

// 清空信件
const clearLetter = () => {
  if (confirm('确定要清空这封信吗？')) {
    letterToFuture.value = ''
    playSound(SoundType.CLICK)
  }
}

// 进入转化阶段
const proceedToTransformStage = () => {
  playSound(SoundType.CLICK)
  
  // 平滑滚动到下一阶段（转化阶段）
  nextTick(() => {
    const transformStage = document.querySelector('.transform-stage')
    if (transformStage) {
      transformStage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// ⑤ 转化阶段状态
const transformStageRef = ref<HTMLElement | null>(null)

// 认知触发机制（从数据加载）
const cognitiveTriggers = computed(() => {
  return travel.value?.data?.cognitiveTriggers
})

// 破晓阶段状态管理
const isVisualGuideActive = ref(false)
const isTriggerLayerActive = ref(false)
const isExperienceRecorded = ref(false)
const isReflectionSaved = ref(false)
const experienceModalVisible = ref(false)
const currentExperienceMode = ref<'meditation' | 'dialogue' | 'vow' | null>(null)
const currentExperience = ref<{ text: string; title: string; mode: string } | null>(null)

// 觉醒体验选项（从awakening阶段activities获取）
const awakeningExperiences = computed(() => {
  const stage = mentalFlowStages.value?.awakening
  const activities = stage?.activities || []
  // 如果少于3个，从认知触发的rituals或moments补充
  if (activities.length < 3) {
    const rituals = cognitiveTriggers.value?.rituals || []
    const moments = cognitiveTriggers.value?.moments || []
    const combined = [...activities, ...rituals.slice(0, 3 - activities.length), ...moments.slice(0, 3 - activities.length)]
    return combined.slice(0, 3)
  }
  return activities.slice(0, 3)
})

// 觉醒触发引导语（从数据获取或使用默认值）
const awakeningTriggerGuide = computed(() => {
  const stage = mentalFlowStages.value?.awakening
  return stage?.emotionalGoal || stage?.symbolicElement || '此刻，请感受身体中的温度。'
})

// 觉醒反思记录
const awakeningReflection = ref('')
const dialogueReflection = ref('')
const vowText = ref('')
const isVowReleased = ref(false)
const particlesContainerRef = ref<HTMLElement | null>(null)

// 对话模式状态
const dialoguePrompt = ref('')
const dialoguePlaceholder = ref('')

// 获取活动标签颜色
const getActivityTagColor = (index: number): string => {
  const colors = [
    'rgba(56, 239, 125, 0.1)', // 绿色
    'rgba(147, 51, 234, 0.1)', // 紫色
    'rgba(99, 102, 241, 0.1)', // 蓝色
    'rgba(245, 101, 101, 0.1)', // 红色
    'rgba(251, 191, 36, 0.1)', // 黄色
    'rgba(16, 185, 129, 0.1)'  // 青色
  ]
  return colors[index % colors.length]
}

// 呼吸引导状态
const isInhaling = ref(true)
const breathingText = ref('吸气...')
const breathingInterval = ref<number | null>(null)

// 触发层触摸状态（用于长按检测）
const triggerTouchStartTime = ref<number>(0)
const triggerTouchTimer = ref<number | null>(null)

// 初始化视觉引导层（延迟触发，但避免重复调用）
const initVisualGuide = () => {
  if (!isVisualGuideActive.value) {
    setTimeout(() => {
      isVisualGuideActive.value = true
    }, 500)
  }
}

// 在组件挂载时初始化
watch(() => dialogueStageRef.value, (el) => {
  if (el) {
    initVisualGuide()
  }
}, { immediate: true })

// 激活心理触发层（点击或长按）
const activateTriggerLayer = () => {
  if (!isTriggerLayerActive.value) {
    isTriggerLayerActive.value = true
    playSound(SoundType.CLICK)
  }
}

const handleTriggerTouchStart = () => {
  triggerTouchStartTime.value = Date.now()
  triggerTouchTimer.value = window.setTimeout(() => {
    activateTriggerLayer()
  }, 500) // 长按500ms触发
}

const handleTriggerTouchEnd = () => {
  if (triggerTouchTimer.value) {
    clearTimeout(triggerTouchTimer.value)
    triggerTouchTimer.value = null
  }
  
  // 如果是快速点击（少于300ms），也触发
  if (Date.now() - triggerTouchStartTime.value < 300) {
    activateTriggerLayer()
  }
}

// 获取体验图标（根据模式类型分配）
const getExperienceIcon = (index: number): string => {
  const experience = awakeningExperiences.value[index] || ''
  const mode = detectExperienceMode(experience, index)
  
  // 根据模式分配图标
  const modeIcons: Record<'meditation' | 'dialogue' | 'vow', string[]> = {
    meditation: ['🧘', '🧘‍♀️', '🧘‍♂️', '🛁', '💧', '♨️', '🌊', '💨'],
    dialogue: ['💬', '🗣️', '👂', '🧙', '🔮', '✨', '🌟', '💫'],
    vow: ['✍️', '📝', '✏️', '🗿', '⛰️', '❄️', '🏔️', '🧊']
  }
  
  const icons = modeIcons[mode] || modeIcons.meditation
  return icons[index % icons.length]
}
// 打开体验模式（根据数据语义智能判断模式类型）
const openExperienceMode = (experience: string, index: number) => {
  playSound(SoundType.CLICK)
  
  // 根据体验内容语义判断使用哪种模式
  const mode = detectExperienceMode(experience, index)
  const title = getExperienceTitle(experience, mode)
  
  currentExperience.value = { text: experience, title, mode }
  currentExperienceMode.value = mode
  experienceModalVisible.value = true
  
  // 根据模式初始化相应的交互
  if (mode === 'meditation') {
    startBreathingGuide()
  } else if (mode === 'dialogue') {
    initDialogueMode(experience)
  } else if (mode === 'vow') {
    initVowMode(experience)
  }
}

// 检测体验模式（根据语义智能匹配）
const detectExperienceMode = (experience: string, index?: number): 'meditation' | 'dialogue' | 'vow' => {
  const text = experience.toLowerCase()
  
  // 冥想模式关键词（静心、呼吸、内观、放松、专注等）
  const meditationKeywords = [
    // 核心冥想词汇
    '冥想', '静心', '内观', '禅修', '打坐', '瑜伽', '正念', '觉知', '观照',
    // 呼吸相关
    '呼吸', '吐纳', '调息', '气息', '深呼吸', '腹式呼吸',
    // 放松相关
    '放松', '舒缓', '平静', '宁静', '安详', '沉静', '静谧', '恬静',
    // 专注相关
    '专注', '集中', '凝神', '定心', '入定', '三昧',
    // 环境相关
    '温泉', '地热', '桑拿', 'spa', '水疗', '泡汤',
    // 身体相关
    '身体', '肌肉', '筋骨', '经络', '穴位', '按摩',
    // 心理相关
    '内心', '心灵', '精神', '意识', '潜意识', '潜意识',
    // 时间相关
    '清晨', '黄昏', '夜晚', '深夜', '黎明', '日出', '日落'
  ]
  
  // 对话模式关键词（对话、聆听、交流、倾听、诉说、回应、萨满、声音等）
  const dialogueKeywords = [
    // 核心对话词汇
    '对话', '谈话', '交流', '沟通', '聊天', '倾诉', '诉说', '表达',
    // 聆听相关
    '聆听', '倾听', '听取', '听取', '听取', '听取', '听取', '听取',
    // 回应相关
    '回应', '反馈', '回答', '答复', '响应', '反应',
    // 萨满相关
    '萨满', '巫师', '灵媒', '通灵', '神谕', '预言', '占卜', '灵性',
    // 声音相关
    '声音', '音声', '音乐', '歌唱', '吟诵', '咒语', '祈祷', '诵经',
    // 感悟相关
    '感悟', '领悟', '启发', '启示', '顿悟', '开悟', '觉醒', '觉醒',
    // 情感相关
    '情感', '情绪', '感受', '体验', '共鸣', '共振', '共情', '同理心',
    // 智慧相关
    '智慧', '哲理', '道理', '真谛', '真理', '智慧', '洞察', '洞见'
  ]
  
  // 誓言模式关键词（誓言、承诺、决心、宣告、立誓、释放、写下、刻下等）
  const vowKeywords = [
    // 核心誓言词汇
    '誓言', '承诺', '诺言', '约定', '契约', '盟约', '誓约', '誓词',
    // 决心相关
    '决心', '决定', '决意', '决断', '决绝', '坚决', '坚定', '坚持',
    // 宣告相关
    '宣告', '宣布', '声明', '宣言', '立誓', '发誓', '起誓', '宣誓',
    // 释放相关
    '释放', '解脱', '解放', '自由', '放下', '舍弃', '抛弃', '摆脱',
    // 记录相关
    '写下', '刻下', '记录', '记载', '铭刻', '镌刻', '雕刻', '篆刻',
    // 新开始相关
    '新', '重新', '再次', '重新开始', '新生', '重生', '复活', '复兴',
    // 愿望相关
    '愿望', '希望', '梦想', '理想', '目标', '志向', '抱负', '追求',
    // 行动相关
    '行动', '实践', '执行', '履行', '实现', '完成', '达成', '成就',
    // 仪式相关
    '仪式', '典礼', '庆典', '祭奠', '祭祀', '祈福', '祝福', '祝愿'
  ]
  
  // 计算匹配度（支持部分匹配和权重计算）
  const calculateScore = (keywords: string[], text: string): number => {
    let score = 0
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // 根据关键词长度和重要性给予不同权重
        if (keyword.length <= 2) {
          score += 3 // 短关键词权重更高
        } else if (keyword.length <= 4) {
          score += 2
        } else {
          score += 1
        }
        
        // 完全匹配额外加分
        if (text.includes(keyword)) {
          score += 1
        }
      }
    })
    return score
  }
  
  const meditationScore = calculateScore(meditationKeywords, text)
  const dialogueScore = calculateScore(dialogueKeywords, text)
  const vowScore = calculateScore(vowKeywords, text)
  
  // 根据匹配度决定模式（增加最小阈值避免误判）
  const minThreshold = 2 // 最小匹配阈值
  
  if (meditationScore >= minThreshold && meditationScore > dialogueScore && meditationScore > vowScore) {
    return 'meditation'
  } else if (dialogueScore >= minThreshold && dialogueScore > vowScore) {
    return 'dialogue'
  } else if (vowScore >= minThreshold) {
    return 'vow'
  }
  
  // 默认：根据索引循环分配（确保三种模式都有机会）
  if (index !== undefined) {
    const modeIndex = index % 3
    if (modeIndex === 0) return 'meditation'
    if (modeIndex === 1) return 'dialogue'
    return 'vow'
  }
  
  // 如果没有任何匹配，默认返回冥想模式
  return 'meditation'
}

// 获取体验标题（根据内容动态生成）
const getExperienceTitle = (experience: string, mode: 'meditation' | 'dialogue' | 'vow'): string => {
  const text = experience.toLowerCase()
  
  if (mode === 'meditation') {
    // 冥想模式标题生成
    if (text.includes('温泉') || text.includes('地热') || text.includes('spa')) {
      return '温泉冥想体验'
    } else if (text.includes('瑜伽') || text.includes('正念')) {
      return '正念瑜伽体验'
    } else if (text.includes('呼吸') || text.includes('调息')) {
      return '呼吸冥想体验'
    } else if (text.includes('清晨') || text.includes('黎明')) {
      return '清晨冥想体验'
    } else if (text.includes('夜晚') || text.includes('深夜')) {
      return '夜晚静心体验'
    } else if (text.includes('身体') || text.includes('按摩')) {
      return '身体觉知体验'
    }
    return '冥想静心体验'
  } else if (mode === 'dialogue') {
    // 对话模式标题生成
    if (text.includes('萨满') || text.includes('灵媒')) {
      return '与萨满对话'
    } else if (text.includes('聆听') || text.includes('倾听')) {
      return '聆听与对话'
    } else if (text.includes('音乐') || text.includes('歌唱')) {
      return '音乐对话体验'
    } else if (text.includes('感悟') || text.includes('领悟')) {
      return '感悟对话体验'
    } else if (text.includes('智慧') || text.includes('哲理')) {
      return '智慧对话体验'
    } else if (text.includes('情感') || text.includes('情绪')) {
      return '情感对话体验'
    }
    return '深度对话体验'
  } else if (mode === 'vow') {
    // 誓言模式标题生成
    if (text.includes('冰川') || text.includes('雪山')) {
      return '在冰川边写下新誓言'
    } else if (text.includes('刻') || text.includes('雕刻')) {
      return '刻下你的新誓言'
    } else if (text.includes('释放') || text.includes('解脱')) {
      return '释放与重生体验'
    } else if (text.includes('新') || text.includes('重新')) {
      return '新开始体验'
    } else if (text.includes('愿望') || text.includes('梦想')) {
      return '愿望实现体验'
    } else if (text.includes('仪式') || text.includes('典礼')) {
      return '仪式誓言体验'
    } else if (text.includes('决心') || text.includes('决定')) {
      return '决心宣言体验'
    }
    return '写下你的新誓言'
  }
  
  return experience
}

// 启动呼吸引导
const startBreathingGuide = () => {
  let breathStep = 0
  const steps = [
    { text: '吸气...', inhale: true, duration: 4000 },
    { text: '屏息...', inhale: true, duration: 1000 },
    { text: '呼气...', inhale: false, duration: 5000 },
    { text: '屏息...', inhale: false, duration: 1000 }
  ]
  
  const cycle = () => {
    const step = steps[breathStep % steps.length]
    isInhaling.value = step.inhale
    breathingText.value = step.text
    
    breathingInterval.value = window.setTimeout(() => {
      breathStep++
      if (breathingInterval.value) {
        cycle()
      }
    }, step.duration) as unknown as number
  }
  
  cycle()
  
  // 30秒后自动停止
  setTimeout(() => {
    if (breathingInterval.value) {
      clearInterval(breathingInterval.value)
      breathingInterval.value = null
    }
  }, 30000)
}

// 初始化对话模式
const initDialogueMode = (experience: string) => {
  // 根据体验内容生成对话提示语
  const stage = mentalFlowStages.value?.awakening
  const triggers = cognitiveTriggers.value
  
  if (triggers?.questions && triggers.questions.length > 0) {
    dialoguePrompt.value = triggers.questions[0]
  } else if (stage?.emotionalGoal) {
    dialoguePrompt.value = stage.emotionalGoal
  } else {
    dialoguePrompt.value = '此刻，你想对自己说什么？'
  }
  
  dialoguePlaceholder.value = '写下你的想法，让它成为与自己的对话...'
}

// 初始化誓言模式
const initVowMode = (experience: string) => {
  vowText.value = ''
  isVowReleased.value = false
}

// 保存对话反思
const saveDialogueReflection = () => {
  if (!dialogueReflection.value.trim()) {
    message.warning('请先写下你的对话内容')
    return
  }
  
  playSound(SoundType.CLICK)
  
  // 保存到localStorage和travel数据
  const reflectionData = {
    text: dialogueReflection.value,
    mode: 'dialogue',
    prompt: dialoguePrompt.value,
    timestamp: new Date().toISOString()
  }
  
  const savedReflections = JSON.parse(localStorage.getItem('awakeningReflections') || '[]')
  savedReflections.push({
    travelId: route.params.id,
    ...reflectionData
  })
  localStorage.setItem('awakeningReflections', JSON.stringify(savedReflections))
  
  message.success('对话已保存')
  dialogueReflection.value = ''
  closeExperienceModal()
}

// 关闭体验模态框
const closeExperienceModal = () => {
  experienceModalVisible.value = false
  
  // 停止呼吸引导
  if (breathingInterval.value) {
    clearInterval(breathingInterval.value)
    breathingInterval.value = null
  }
  
  // 清理状态
  dialogueReflection.value = ''
  vowText.value = ''
  
  // 标记已记录体验
  if (!isExperienceRecorded.value) {
    isExperienceRecorded.value = true
  }
  
  playSound(SoundType.CLICK)
}

// ========== 触摸交互模式 ==========
const touchRipples = ref<Array<{ style: string }>>([])
const warmthLevel = ref(0)
const warmthMessage = ref('')
const isTouching = ref(false)

const initTouchInteraction = () => {
  warmthLevel.value = 0
  warmthMessage.value = '等待你的触摸...'
}

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  createTouchRipple(touch.clientX, touch.clientY)
  isTouching.value = true
  updateWarmth(true)
}

const handleTouchMove = (e: TouchEvent) => {
  if (isTouching.value) {
    const touch = e.touches[0]
    createTouchRipple(touch.clientX, touch.clientY)
    updateWarmth(true)
  }
}

const handleTouchEnd = () => {
  isTouching.value = false
  updateWarmth(false)
}

const handleMouseDown = (e: MouseEvent) => {
  createTouchRipple(e.clientX, e.clientY)
  isTouching.value = true
  updateWarmth(true)
}

const handleMouseMove = (e: MouseEvent) => {
  if (isTouching.value) {
    createTouchRipple(e.clientX, e.clientY)
    updateWarmth(true)
  }
}

const handleMouseUp = () => {
  isTouching.value = false
  updateWarmth(false)
}

const createTouchRipple = (x: number, y: number) => {
  const ripple = {
    style: `left: ${x}px; top: ${y}px;`
  }
  touchRipples.value.push(ripple)
  
  setTimeout(() => {
    touchRipples.value = touchRipples.value.filter(r => r !== ripple)
  }, 1000)
}

const updateWarmth = (increasing: boolean) => {
  if (increasing) {
    warmthLevel.value = Math.min(1, warmthLevel.value + 0.05)
    if (warmthLevel.value > 0.7) {
      warmthMessage.value = '温度正在传递...'
    } else if (warmthLevel.value > 0.4) {
      warmthMessage.value = '感受到温暖了'
    } else {
      warmthMessage.value = '轻抚画面...'
    }
  } else {
    warmthLevel.value = Math.max(0, warmthLevel.value - 0.02)
    if (warmthLevel.value < 0.1) {
      warmthMessage.value = '等待你的触摸...'
    }
  }
}

// ========== 视觉追踪模式 ==========
const gazeTrackingRef = ref<HTMLElement | null>(null)
const gazeAngle = ref(0)
const gazeIntensity = ref(0.5)
const gazeFocus = ref(1)
const gazeFeedback = ref('请移动鼠标或注视屏幕中心')

const initGazeTracking = () => {
  gazeAngle.value = 0
  gazeIntensity.value = 0.5
  gazeFocus.value = 1
  gazeFeedback.value = '请移动鼠标或注视屏幕中心'
  
  if (gazeTrackingRef.value) {
    gazeTrackingRef.value.addEventListener('mousemove', handleGazeMove)
  }
}

const handleGazeMove = (e: MouseEvent) => {
  if (!gazeTrackingRef.value) return
  
  const rect = gazeTrackingRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const dx = e.clientX - centerX
  const dy = e.clientY - centerY
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  gazeAngle.value = angle + 90
  const distance = Math.sqrt(dx * dx + dy * dy)
  const maxDistance = Math.max(rect.width, rect.height) / 2
  
  gazeIntensity.value = Math.max(0.3, 1 - distance / maxDistance)
  gazeFocus.value = 1 + (distance / maxDistance) * 0.5
  
  if (distance < maxDistance * 0.3) {
    gazeFeedback.value = '专注力提升中...'
  } else if (distance < maxDistance * 0.6) {
    gazeFeedback.value = '光在跟随你的目光'
  } else {
    gazeFeedback.value = '继续注视中心...'
  }
}

// ========== 声音交互模式 ==========
const soundVisualizerRef = ref<HTMLElement | null>(null)
const soundBars = ref<Array<{ height: number }>>([])
const isRecordingSound = ref(false)
const soundFeedback = ref('点击开始按钮，发出声音')
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let microphone: MediaStreamAudioSourceNode | null = null
let animationFrameId: number | null = null

const initSoundInteraction = () => {
  // 初始化音频可视化条
  soundBars.value = Array.from({ length: 20 }, () => ({ height: 10 }))
}

const toggleSoundRecording = async () => {
  if (!isRecordingSound.value) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyser = audioContext.createAnalyser()
      microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      isRecordingSound.value = true
      soundFeedback.value = '正在聆听你的声音...'
      
      const updateSoundBars = () => {
        if (!analyser || !isRecordingSound.value) return
        
        analyser.getByteFrequencyData(dataArray)
        
        const barCount = soundBars.value.length
        const step = Math.floor(bufferLength / barCount)
        
        soundBars.value = Array.from({ length: barCount }, (_, i) => {
          const index = i * step
          const value = dataArray[index]
          return { height: Math.max(10, (value / 255) * 100) }
        })
        
        animationFrameId = requestAnimationFrame(updateSoundBars)
      }
      
      updateSoundBars()
    } catch (error) {
      console.error('无法访问麦克风:', error)
      soundFeedback.value = '无法访问麦克风，请检查权限'
    }
  } else {
    stopSoundRecording()
  }
}

const stopSoundRecording = () => {
  isRecordingSound.value = false
  soundFeedback.value = '声音已停止'
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  if (microphone) {
    microphone.disconnect()
    microphone = null
  }
  
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  // 重置可视化条
  soundBars.value = soundBars.value.map(() => ({ height: 10 }))
}

// ========== 文字粒子模式 ==========
const particleText = ref('')
const textParticles = ref<Array<{ char: string; style: string }>>([])
const particleCanvasRef = ref<HTMLElement | null>(null)

const initTextParticles = () => {
  textParticles.value = []
  particleText.value = ''
}

const generateTextParticles = () => {
  if (!particleText.value.trim()) {
    textParticles.value = []
    return
  }
  
  const chars = particleText.value.split('')
  textParticles.value = chars.map((char, index) => {
    const angle = (index / chars.length) * 360
    const radius = 100 + Math.random() * 50
    const x = 50 + (radius * Math.cos(angle * Math.PI / 180)) / 2
    const y = 50 + (radius * Math.sin(angle * Math.PI / 180)) / 2
    
    return {
      char: char === ' ' ? '·' : char,
      style: `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        font-size: ${14 + Math.random() * 8}px;
        opacity: ${0.6 + Math.random() * 0.4};
        animation: particleFloat ${2 + Math.random() * 2}s ease-in-out infinite;
        animation-delay: ${index * 0.05}s;
      `
    }
  })
}

// 释放誓言（文字吹散特效）
const releaseVow = () => {
  if (!vowText.value.trim()) return
  
  playSound(SoundType.CLICK)
  isVowReleased.value = true
  
  // 创建文字粒子动画
  nextTick(() => {
    if (particlesContainerRef.value) {
      createTextParticles(vowText.value, particlesContainerRef.value)
    }
    
    // 延迟关闭模态框
    setTimeout(() => {
      vowText.value = ''
      isVowReleased.value = false
      closeExperienceModal()
    }, 2000)
  })
}

// 创建文字粒子动画
const createTextParticles = (text: string, container: HTMLElement) => {
  const chars = text.split('').filter(c => c !== ' ' && c !== '\n')
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  
  chars.forEach((char, index) => {
    const particle = document.createElement('span')
    particle.textContent = char
    particle.className = 'text-particle'
    
    // 从中心位置开始
    particle.style.left = `${centerX}px`
    particle.style.top = `${centerY}px`
    
    // 随机方向和距离
    const angle = (Math.PI * 2 * index) / chars.length + (Math.random() - 0.5) * 0.5
    const distance = 200 + Math.random() * 150
    const tx = Math.cos(angle) * distance
    const ty = Math.sin(angle) * distance
    const rot = (Math.random() - 0.5) * 720
    
    particle.style.setProperty('--tx', `${tx}px`)
    particle.style.setProperty('--ty', `${ty}px`)
    particle.style.setProperty('--rot', `${rot}deg`)
    particle.style.animationDelay = `${index * 0.03}s`
    
    container.appendChild(particle)
    
    setTimeout(() => {
      if (particle.parentElement) {
        particle.remove()
      }
    }, 2500)
  })
}

// 保存觉醒反思
const saveAwakeningReflection = async () => {
  if (!awakeningReflection.value.trim()) {
    message.warning('请先写下你的感受')
    return
  }
  
  playSound(SoundType.CLICK)
  
  // 保存到localStorage和travel数据
  const reflectionData = {
    text: awakeningReflection.value,
    dialogueReflection: dialogueReflection.value,
    vow: vowText.value,
    timestamp: new Date().toISOString()
  }
  
  const savedReflections = JSON.parse(localStorage.getItem('awakeningReflections') || '[]')
  savedReflections.push({
    travelId: route.params.id,
    ...reflectionData
  })
  localStorage.setItem('awakeningReflections', JSON.stringify(savedReflections))
  
  // 保存到travel数据
  if (travel.value && travelListStore) {
    const updatedTravel = {
      ...travel.value,
      data: {
        ...travel.value.data,
        awakeningReflection: reflectionData
      }
    }
    travelListStore.updateTravel(travel.value.id, updatedTravel)
  }
  
  isReflectionSaved.value = true
  message.success('你的觉醒印记已保存')
  
  // 延迟回响效果
  setTimeout(() => {
    playSound(SoundType.CLICK)
  }, 1000)
}

// 完成的问题集合（保留用于兼容性）
const completedQuestions = ref<Set<string>>(new Set())

// 治愈性设计要素（从数据加载）
const healingDesign = computed(() => {
  return travel.value?.data?.healingDesign
})

// 旅行后延伸挑战（从数据加载）
const postJourneyChallenge = computed(() => {
  return travel.value?.data?.postJourneyChallenge
})

// 关键词总结（从数据加载）
const inspirationKeywords = computed(() => {
  return travel.value?.data?.keywords
})

// mentalFlowStages 已在上面定义，此处注释避免重复

// 旅程设计面板状态
const isDesignPanelOpen = ref(false)

// 切换设计面板
const toggleDesignPanel = () => {
  isDesignPanelOpen.value = !isDesignPanelOpen.value
  playSound(SoundType.CLICK)
}

// 关闭设计面板
const closeDesignPanel = () => {
  isDesignPanelOpen.value = false
  playSound(SoundType.CLICK)
}

// 旅程背景（从数据加载）
const journeyBackground = computed(() => {
  return travel.value?.data?.journeyBackground
})

// 旅程故事（从数据加载，优先使用story，其次使用subtitle）
const journeyStory = computed(() => {
  // 优先使用 story 字段，其次使用 subtitle
  return travel.value?.data?.story || travel.value?.data?.subtitle || ''
})

// 丰富的目的地信息（包含详细信息）
const enrichedDestinations = computed(() => {
  if (!travel.value?.data?.locationDetails) {
    return []
  }
  
  return Object.entries(travel.value.data.locationDetails).map(([name, detail]: [string, any]) => ({
    name,
    duration: detail.duration,
    budget: detail.budget,
    aiMessage: detail.aiMessage,
    highlights: Array.isArray(detail.highlights) ? detail.highlights : []
  }))
})

// 全局亮点（从数据加载）
const globalHighlights = computed(() => {
  const highlights = travel.value?.data?.highlights || []
  return Array.isArray(highlights) ? highlights : []
})

// 获取阶段图标
const getStageIcon = (stageKey: string): string => {
  const icons: Record<string, string> = {
    summon: '🌿',
    reflection: '💭',
    awakening: '🌠',
    internalization: '🌙',
    transformation: '🔥'
  }
  return icons[stageKey] || '✨'
}

// 获取阶段名称
const getStageName = (stageKey: string): string => {
  const names: Record<string, string> = {
    summon: '召唤',
    reflection: '映照',
    awakening: '觉醒',
    internalization: '内化',
    transformation: '转化'
  }
  return names[stageKey] || stageKey
}

// 从mentalFlowStages获取各阶段动态内容
const reflectionStageContent = computed(() => {
  const stage = mentalFlowStages.value?.reflection
  return {
    title: stage?.theme || '',
    subtitle: stage?.emotionalGoal || '',
    emotionalExtension: stage?.symbolicElement || '',
    hint: stage?.symbolicElement || '',
    continueButton: stage?.activities?.[0] || ''
  }
})

const dialogueStageContent = computed(() => {
  // 优先使用 awakening 阶段数据，其次使用 reflection 阶段数据
  const awakeningStage = mentalFlowStages.value?.awakening
  const reflectionStage = mentalFlowStages.value?.reflection
  const stage = awakeningStage || reflectionStage
  
  return {
    title: stage?.theme || '',
    subtitle: stage?.emotionalGoal || '',
    conclusion: stage?.symbolicElement || '',
    continueButton: awakeningStage?.activities?.[0] || reflectionStage?.activities?.[0] || ''
  }
})

const internalizationStageContent = computed(() => {
  const stage = mentalFlowStages.value?.internalization
  return {
    title: stage?.theme || internalizationTexts.value.stageTitle || '',
    subtitle: stage?.emotionalGoal || internalizationTexts.value.stageSubtitle || '',
    letterTitle: stage?.symbolicElement || internalizationTexts.value.letterTitle || '',
    letterHint: internalizationTexts.value.letterHint || '',
    placeholder: internalizationTexts.value.placeholder || '',
    saveButtonText: internalizationTexts.value.saveButtonText || '',
    savedMessage: internalizationTexts.value.savedMessage || '',
    continueButton: internalizationTexts.value.continueButtonText || '',
    activities: stage?.activities || []
  }
})


const transformationStageContent = computed(() => {
  const stage = mentalFlowStages.value?.transformation
  return {
    title: stage?.theme || transformationContent.value.stageTitle || '',
    subtitle: stage?.emotionalGoal || transformationContent.value.stageSubtitle || '',
    endingText: stage?.symbolicElement || transformationContent.value.endingText || '',
    communityTitle: transformationContent.value.communityTitle || '',
    communityDescription: transformationContent.value.communityDescription || ''
  }
})
const awakeningStageContent = computed(() => {
  const stage = mentalFlowStages.value?.awakening
  return {
    text: awakeningMomentText.value || stage?.emotionalGoal || '',
    entranceText: awakeningEntranceText.value || stage?.symbolicElement || ''
  }
})

// ===== 统一阶段数据（数据驱动） =====
const summonStageData = computed(() => {
  const stage = mentalFlowStages.value?.summon as any
  if (!stage) return null as any
  return {
    title: stage?.theme || '放下重负',
    subtitle: stage?.emotionalGoal || stage?.symbolicElement || '',
    activities: Array.isArray(stage?.activities) ? stage.activities.slice(0, 5) : []
  }
})

const reflectionStageData = computed(() => {
  const stage = mentalFlowStages.value?.reflection as any
  if (!stage) return null as any
  return {
    title: stage?.theme || '镜湖映心',
    subtitle: stage?.emotionalGoal || stage?.symbolicElement || '看清内心真实模样',
    activities: Array.isArray(stage?.activities) ? stage.activities : []
  }
})

const awakeningStageData = computed(() => {
  const stage = mentalFlowStages.value?.awakening as any
  if (!stage) return null as any
  return {
    title: stage?.theme || '破晓时刻',
    subtitle: stage?.emotionalGoal || stage?.symbolicElement || '',
    activities: Array.isArray(stage?.activities) ? stage.activities.slice(0, 5) : []
  }
})

const internalizationStageData = computed(() => {
  const stage = mentalFlowStages.value?.internalization as any
  if (!stage) return null as any
  return {
    title: stage?.theme || '种子沉淀',
    subtitle: stage?.emotionalGoal || stage?.symbolicElement || '',
    activities: Array.isArray(stage?.activities) ? stage.activities : []
  }
})

const transformationStageData = computed(() => {
  const stage = mentalFlowStages.value?.transformation as any
  if (!stage) return null as any
  return {
    title: stage?.theme || '转化',
    subtitle: stage?.emotionalGoal || stage?.symbolicElement || '',
    activities: Array.isArray(stage?.activities) ? stage.activities.slice(0, 5) : []
  }
})

// 保留旧的计算属性以兼容（这些变量已在其他地方声明，无需重复声明）
// summonStageContent, awakeningStageCardContent, internalizationStageContent, transformationStageContent

// 导航到指定阶段
const navigateToStage = (stageKey: string) => {
  playSound(SoundType.CLICK)
  
  nextTick(() => {
    let targetElement: HTMLElement | null = null
    
    switch (stageKey) {
      case 'summon':
        // 召唤阶段在 InspirationHero 中，这里不做处理
        // 或者可以滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      case 'reflection':
        targetElement = reflectionStageRef.value
        break
      case 'awakening':
        targetElement = awakeningPeakStageRef.value
        break
      case 'internalization':
        targetElement = internalizationStageRef.value
        break
      case 'transformation':
        targetElement = transformStageRef.value
        break
      default:
        // 对话阶段（dialogue）对应四大支柱
        targetElement = dialogueStageRef.value
    }
    
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 转化阶段内容（AI生成）
const transformationContent = ref({
  travelerStories: [],
  stageTitle: '',
  stageSubtitle: '',
  communityTitle: '',
  communityDescription: '',
  endingText: ''
})

// 生成转化阶段内容（AI生成）
const generateTransformationContent = async () => {
  // 如果已有数据，不重复生成
  if (transformationContent.value.stageTitle) {
    return
  }
  
  // 从travel数据加载
  const saved = travel.value?.data?.transformationContent
  if (saved) {
    transformationContent.value = saved
    return
  }
  
  const intentData = travel.value?.data?.detectedIntent || {
    intentType: 'photography_exploration',
    emotionTone: '平静'
  }
  const userInput = travel.value?.data?.inspirationInput || travel.value?.data?.userInput
  const destination = selectedLocationName.value || travel.value?.data?.destination
  
  try {
    const language = (() => {
      const locale = (t as any).locale?.value || (window as any).__VUE_I18N__?.global?.locale?.value || 'zh-CN'
      return locale
    })()
    
    const result = await generateTransformationContent(
      intentData,
      userInput,
      destination,
      language
    )
    
    // 为故事生成头像URL
    result.travelerStories = result.travelerStories.map((story: any, index: number) => ({
      ...story,
      avatar: story.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.name || index}`
    }))
    
    transformationContent.value = result
    
    // 保存到travel数据
    if (travel.value && travelListStore) {
      const updatedTravel = {
        ...travel.value,
        data: {
          ...travel.value.data,
          transformationContent: result,
          travelerStories: result.travelerStories
        }
      }
      travelListStore.updateTravel(travel.value.id, updatedTravel)
    }
    
    console.log('✅ 转化阶段内容AI生成成功:', result)
  } catch (error) {
    console.error('生成转化阶段内容失败:', error)
    // 使用默认值
    transformationContent.value = {
      travelerStories: [],
      stageTitle: '旅程的延续',
      stageSubtitle: '从这里开始，让灵感成为现实',
      communityTitle: '加入同路人',
      communityDescription: '我们还在路上，一起走一段？',
      endingText: '旅程，从现在开始。'
    }
  }
}

// ⑤ 转化阶段：真实旅人故事（从数据中提取，优先使用AI生成）
const travelerStories = computed(() => {
  // 1. 优先使用AI生成的故事
  if (transformationContent.value.travelerStories && transformationContent.value.travelerStories.length > 0) {
    return transformationContent.value.travelerStories.map((story: any) => ({
      name: story.name || '旅人',
      avatar: story.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.name || Math.random()}`,
      location: story.location || selectedLocationName.value,
      date: new Date().toLocaleDateString('zh-CN'),
      content: story.content || story.story || '',
      tags: story.tags || []
    }))
  }
  
  // 2. 从 travel.data.travelerStories 中获取（如果AI已生成）
  if (travel.value?.data?.travelerStories && Array.isArray(travel.value.data.travelerStories)) {
    return travel.value.data.travelerStories.map((story: any) => ({
      name: story.name || '旅人',
      avatar: story.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      location: story.location || selectedLocationName.value,
      date: story.date || new Date().toLocaleDateString('zh-CN'),
      content: story.content || story.story || '',
      tags: story.tags || []
    }))
  }
  
  // 2. 从 companions 中生成（如果存在）
  if (companions.value.length > 0) {
    return companions.value.slice(0, 3).map(companion => ({
      name: companion.name,
      avatar: companion.avatar,
      location: selectedLocationName.value,
      date: new Date().toLocaleDateString('zh-CN'),
      content: getCompanionMessage(companion),
      tags: []
    }))
  }
  
  // 3. 返回空数组（如果没有数据）
  return []
})


// 加入社群（温馨的"回家"式体验）
// 分享故事
const shareStory = () => {
  playSound(SoundType.CLICK)
  
  Modal.info({
    title: '🔆 点亮你的旅程',
    content: h('div', { style: { padding: '1rem 0' } }, [
      h('p', { style: { fontSize: '1rem', lineHeight: '1.8', marginBottom: '1rem', color: '#66707a' } },
        '分享一段改变的小故事，让更多人看到你的光芒。'),
      h('p', { style: { fontSize: '0.9rem', lineHeight: '1.6', color: '#999', fontStyle: 'italic' } },
        '每一个故事，都是旅程中的一道光。')
    ]),
    okText: '知道了',
    width: 500
  })
}

const joinCommunity = () => {
  playSound(SoundType.CLICK)
  
  // 创建温馨的社群入口体验
  Modal.info({
    title: transformationContent.value.communityTitle || '加入篝火',
    content: h('div', { style: { padding: '1rem 0' } }, [
      h('p', { style: { fontSize: '1rem', lineHeight: '1.8', marginBottom: '1rem', color: '#66707a' } },
        transformationContent.value.communityDescription || '和同行者继续对话'),
      h('p', { style: { fontSize: '0.9rem', lineHeight: '1.6', color: '#999', fontStyle: 'italic' } },
        '这里，有人和你一样，在路上慢慢明白。')
    ]),
    okText: '一起走一段',
    onOk: () => {
      message.success('欢迎回家！期待与你分享旅程')
      // TODO: 实际加入社群逻辑（API调用、跳转等）
    }
  })
}

// 当前哲思句索引（用于轮播）
const currentPhilosophyIndex = ref(0)
const philosophySentences = ref([
  '山不会说话，但它会教你什么是坚持。',
  '每一步脚印，都是风景的回答。',
  '旅行不是出发，而是重新看见。',
  '当呼吸都变得困难时，你才发现活着本身就是最大的奇迹。',
  '在路的尽头，你会遇见另一个自己。',
  '风景不会记住你，但你会记住风景。'
])

// 背景图片切换
const backgroundImageIndex = ref(0)
const backgroundImages = computed(() => {
  return floatingImages.value.length > 0 ? floatingImages.value : []
})

// 计算属性
const selectedLocationName = computed(() => {
  const selectedLocation = travel.value?.data?.selectedLocation || 
    (travel.value?.data?.locationDetails ? Object.keys(travel.value.data.locationDetails)[0] : null)
  return selectedLocation || '这里'
})

const floatingImages = computed(() => {
  const images = materialImages.value
  return images.slice(0, Math.min(5, images.length))
})

// AI灵感摘要文本（从数据中获取，不硬编码）
const aiSummaryText = computed(() => {
  // 优先使用当前选中地点的 aiMessage
  const selectedLocation = selectedLocationName.value
  if (selectedLocation && travel.value?.data?.locationDetails?.[selectedLocation]?.aiMessage) {
    return travel.value.data.locationDetails[selectedLocation].aiMessage
  }
  // 其次使用全局的 aiMessage
  if (travel.value?.data?.aiMessage) {
    return travel.value.data.aiMessage
  }
  // 如果都没有，使用体验日的 aiSummary
  if (dayExperience.value?.narration) {
    return dayExperience.value.narration
  }
  // 如果没有数据，返回空字符串（不应该显示）
  return ''
})

// AI旁白文本（从配置中获取，不硬编码）
const aiNarrationText = computed(() => {
  // 优先从配置模板中获取
  const intentType = travel.value?.data?.detectedIntent?.intentType
  const templates = aiFeedbackTemplates || []
  
  // 如果是摄影或城市创作意图，使用特定模板
  if (intentType === 'photography_exploration' || intentType === 'urban_creation') {
    if (templates.length > 0 && typeof templates[0] === 'function') {
      // 使用模板生成（不需要输入，用空字符串）
      return ''
    }
  }
  
  // 如果没有模板，返回空字符串
  return ''
})

// 动态关键词气泡（从数据中提取，不硬编码，合并自定义标签）
const dynamicMoodItems = computed(() => {
  const items: Array<{ id: string; icon: string; text: string; images: string[] }> = []
  const selectedLocation = selectedLocationName.value
  
  // 1. 优先从当前目的地的 highlights 中提取
  if (selectedLocation && travel.value?.data?.locationDetails?.[selectedLocation]?.highlights) {
    const highlights = travel.value.data.locationDetails[selectedLocation].highlights
    highlights.slice(0, 5).forEach((highlight: any, index: number) => {
      const text = typeof highlight === 'string' ? highlight : (highlight.title || highlight.description || '')
      if (text) {
        items.push({
          id: `data-${selectedLocation}-${index}`,
          icon: getIconByKeyword(text),
          text: text.substring(0, 4) || text,
          images: []
        })
      }
    })
  }
  
  // 2. 其次从 detectedIntent.keywords 中提取
  if (items.length < 5 && travel.value?.data?.detectedIntent?.keywords) {
    travel.value.data.detectedIntent.keywords.slice(0, 5 - items.length).forEach((keyword: string, index: number) => {
      if (!items.find(item => item.text === keyword)) {
        items.push({
          id: `keyword-${index}`,
          icon: getIconByKeyword(keyword),
          text: keyword.substring(0, 4) || keyword,
          images: []
        })
      }
    })
  }
  
  // 3. 再次从体验日的 emotionTags 中提取
  if (items.length < 5 && dayExperience.value?.emotionTags) {
    const emotionTags = Array.isArray(dayExperience.value.emotionTags) 
      ? dayExperience.value.emotionTags 
      : []
    emotionTags.slice(0, 5 - items.length).forEach((tag: string, index: number) => {
      if (!items.find(item => item.text === tag)) {
        items.push({
          id: `emotion-${index}`,
          icon: getIconByKeyword(tag),
          text: tag.substring(0, 4) || tag,
          images: []
        })
      }
    })
  }
  
  // 4. 最后从全局 highlights 中提取
  if (items.length < 5 && travel.value?.data?.highlights) {
    const highlights = Array.isArray(travel.value.data.highlights) 
      ? travel.value.data.highlights 
      : []
    highlights.slice(0, 5 - items.length).forEach((highlight: any, index: number) => {
      const text = typeof highlight === 'string' ? highlight : (highlight.title || '')
      if (text && !items.find(item => item.text === text)) {
        items.push({
          id: `highlight-${index}`,
          icon: getIconByKeyword(text),
          text: text.substring(0, 4) || text,
          images: []
        })
      }
    })
  }
  
  // 如果还是没有，尝试从意图类型映射中获取
  if (items.length === 0) {
    const intentType = travel.value?.data?.detectedIntent?.intentType
    if (intentType && intentMoodMap[intentType]) {
      return intentMoodMap[intentType].slice(0, 5).map((item: any, index: number) => ({
        id: `intent-${index}`,
        icon: item.icon || '✨',
        text: item.text || item,
        images: []
      }))
    }
    // 如果连意图映射都没有，返回空数组
    return []
  }
  
  // 合并用户自定义的标签（并更新已有标签的图片）
  const mergedItems = items.map(item => {
    const customItem = customMoodItems.value.find(c => c.id === item.id || c.text === item.text)
    if (customItem) {
      return {
        ...item,
        images: customItem.images
      }
    }
    return item
  })
  
  // 添加新的自定义标签
  customMoodItems.value.forEach(customItem => {
    if (!mergedItems.find(item => item.id === customItem.id)) {
      mergedItems.push(customItem)
    }
  })
  
  return mergedItems.slice(0, 10) // 最多10个气泡（包含自定义）
})

// 推荐目的地卡片（从 locationDetails 中获取，不硬编码）
const destinationCards = computed(() => {
  const cards: Array<{ name: string; description?: string }> = []
  
  if (travel.value?.data?.locationDetails) {
    Object.entries(travel.value.data.locationDetails).forEach(([locationName, detail]: [string, any]) => {
      cards.push({
        name: locationName,
        description: detail.description || detail.aiMessage || undefined
      })
    })
  } else if (travel.value?.data?.locations && Array.isArray(travel.value.data.locations)) {
    // 如果没有 locationDetails，至少显示地点名称
    travel.value.data.locations.forEach((loc: string) => {
      cards.push({ name: loc })
    })
  } else if (travel.value?.data?.location) {
    // 单个地点的情况
    cards.push({ name: travel.value.data.location })
  }
  
  return cards
})

// 生成推荐目的地卡片的完整信息（包含情绪文案、标签、CTA等）
const enrichedDestinationCards = computed(() => {
  const cards = destinationCards.value
  const intentType = travel.value?.data?.detectedIntent?.intentType || 'default'
  
  return cards.map((dest, index) => {
    // 生成标题：目的地/主题
    const title = dest.name
    
    // 生成一句话情绪文案（Lede）- 使用AI模板
    const ledeTemplates = [
      `在${dest.name}的风里，把心事吹得只剩下勇气。`,
      `当你在${dest.name}抬头，云会替你把烦恼带走。`,
      `把脚步交给${dest.name}，把思绪留在那里。`,
      `在${dest.name}，学会慢下来。`,
      `把自己藏进${dest.name}的光里，重新发光。`,
      `${dest.name}不会说话，但它会教你什么是坚持。`
    ]
    const lede = dest.description || ledeTemplates[index % ledeTemplates.length]
    
    // 生成简短说明（Meta）
    const metaTemplates = [
      '路不会回答你，但它会把答案写在风景里。',
      '远方并不远，只差一个拥抱世界的理由。',
      `每一口呼吸，都是和${dest.name}的和解。`,
      '把脚步换成页码，让今天成为出走的序章。',
      `情绪是行李，${dest.name}是刚好合身的外套。`,
      '当呼吸都变得困难时，你才发现活着本身就是最大的奇迹。'
    ]
    const meta = metaTemplates[index % metaTemplates.length]
    
    // 生成情绪标签Chip（根据意图类型和目的地）
    const chips = generateDestinationChips(dest.name, intentType, dest.description)
    
    // AI提示语
    const aiHints = [
      '或许这座城市，也在等你去记录它。',
      '让旅程先从一句话开始。',
      '把这份心动，交给行程去安排。',
      '点开看一条为你量身定制的路。',
      '也许你的答案，就藏在下一站。'
    ]
    const aiHint = aiHints[index % aiHints.length]
    
    return {
      id: `dest-${index}`,
      originalName: dest.name,
      title,
      lede,
      meta,
      chips,
      aiHint
    }
  })
})

// 生成目的地的情绪标签Chip
const generateDestinationChips = (locationName: string, intentType: string, description?: string): Array<{ type: string; emoji: string; label: string }> => {
  const chips: Array<{ type: string; emoji: string; label: string }> = []
  
  // 根据意图类型添加标签
  if (intentType === 'extreme_exploration' || intentType === 'photography_exploration') {
    chips.push({ type: 'explore', emoji: '🗺️', label: '探索' })
  }
  if (intentType === 'emotional_healing' || intentType === 'mind_healing') {
    chips.push({ type: 'heal', emoji: '🕊️', label: '疗愈' })
  }
  if (intentType === 'urban_creation' || intentType === 'photography_exploration') {
    chips.push({ type: 'city', emoji: '🏙️', label: '城市' })
  }
  if (intentType === 'emotional_healing' || locationName.includes('山') || locationName.includes('湖') || locationName.includes('海')) {
    chips.push({ type: 'nature', emoji: '🏔️', label: '自然' })
  }
  
  // 如果没有标签，根据描述添加
  if (chips.length === 0) {
    if (description) {
      const desc = description.toLowerCase()
      if (desc.includes('城市') || desc.includes('街') || desc.includes('建筑')) {
        chips.push({ type: 'city', emoji: '🏙️', label: '城市' })
      } else if (desc.includes('山') || desc.includes('自然') || desc.includes('风景')) {
        chips.push({ type: 'nature', emoji: '🏔️', label: '自然' })
      } else {
        chips.push({ type: 'explore', emoji: '🗺️', label: '探索' })
      }
    } else {
      // 默认标签
      chips.push({ type: 'explore', emoji: '🗺️', label: '探索' })
    }
  }
  
  return chips.slice(0, 2) // 最多2个标签
}


// 获取卡片高度类（高低错落）
const getCardHeightClass = (index: number): string => {
  // 每3张卡为一个循环：tall, normal, normal
  const pattern = index % 3
  if (pattern === 0) return 'tall'
  return 'normal'
}

// 获取卡片大小类（随机大小变化）
const getCardSizeClass = (index: number): string => {
  const pattern = index % 4
  if (pattern === 1) return 'size-small'
  if (pattern === 2) return 'size-medium'
  return 'size-normal'
}

// 获取卡片旋转角度（错乱效果）
const getCardRotation = (index: number): number => {
  const rotations = [-1.5, 0.8, 1.2, -0.8, 0.5, -1.1, 0.3, -0.5, 1.5, -0.3]
  return rotations[index % rotations.length]
}

// 获取卡片X轴偏移（错乱效果）
const getCardOffsetX = (index: number): number => {
  const offsets = [0, 3, -4, 2, -3, 5, -2, 4, -5, 1]
  return offsets[index % offsets.length]
}

// 获取卡片Y轴偏移（错乱效果）
const getCardOffsetY = (index: number): number => {
  const offsets = [0, -2, 3, -4, 2, -3, 4, -1, 3, -2]
  return offsets[index % offsets.length]
}

// 处理目的地卡片点击
const handleDestinationCardClick = (card: any) => {
  console.log('点击目的地卡片:', card) // 调试日志
  playSound(SoundType.CLICK)
  // TODO: 可以导航到该目的地的详情页或触发其他操作
  message.info(`已选择目的地: ${card.title}`)
}


const moodItems = computed(() => {
  // 保留原有逻辑以兼容性
  return dynamicMoodItems.value
})

const aiDestinations = computed(() => {
  const selectedLocation = travel.value?.data?.selectedLocation
  if (selectedLocation) return [selectedLocation]
  
  if (travel.value?.data?.locationDetails) {
    const locations = Object.keys(travel.value.data.locationDetails)
    return locations.slice(0, 3)
  }
  
  return [travel.value?.data?.destination || t('travelDetail.experienceDay.destination1')]
})

const dayExperience = computed(() => {
  if (!travel.value?.data) {
    return {
      title: '',
      location: '',
      timeRange: '',
      mood: '',
      timeline: [],
      narration: ''
    }
  }
  
  // 简化的体验日数据计算
  const selectedLocation = travel.value.data.selectedLocation
  let experienceDay = null
  
  if (selectedLocation && travel.value.data.experiences?.[selectedLocation]) {
    experienceDay = travel.value.data.experiences[selectedLocation]
  } else if (travel.value.data.experienceDay) {
    experienceDay = travel.value.data.experienceDay
  }
  
  return {
    title: experienceDay?.title || travel.value.data.title || '',
    location: selectedLocation || travel.value.data.destination || '',
    timeRange: experienceDay?.timeRange || '全天',
    mood: experienceDay?.theme || experienceDay?.mood || '',
    timeline: experienceDay?.timeline || [],
    narration: experienceDay?.aiSummary || experienceDay?.narration || '',
    emotionTags: experienceDay?.emotionTags || []
  }
})

// 将时间线按时间段分组（morning/afternoon/evening）- 从数据中获取，不硬编码
const journeyTimeline = computed(() => {
  const timeline = dayExperience.value?.timeline || []
  if (timeline.length === 0) return []

  const periods: Array<{
    type: 'morning' | 'afternoon' | 'evening'
    icon: string
    timeLabel: string
    activities: Array<{
      time: string
      activity: string
      narration?: string
      aiNarration?: string
    }>
  }> = [
    { type: 'morning', icon: '🌅', timeLabel: '清晨', activities: [] },
    { type: 'afternoon', icon: '☀️', timeLabel: '午后', activities: [] },
    { type: 'evening', icon: '🌙', timeLabel: '夜晚', activities: [] }
  ]

  timeline.forEach((item: any) => {
    const time = item.time || ''
    const hour = parseInt(time.split(':')[0]) || 0
    
    // 根据时间判断时间段：早(5-12)、午(12-18)、晚(18-5)
    if (hour >= 5 && hour < 12) {
      periods[0].activities.push({
        time: item.time,
        activity: item.activity,
        narration: item.narration,
        aiNarration: item.aiNarration
      })
    } else if (hour >= 12 && hour < 18) {
      periods[1].activities.push({
        time: item.time,
        activity: item.activity,
        narration: item.narration,
        aiNarration: item.aiNarration
      })
    } else {
      periods[2].activities.push({
        time: item.time,
        activity: item.activity,
        narration: item.narration,
        aiNarration: item.aiNarration
      })
    }
  })

  // 过滤掉没有活动的时段
  return periods.filter(p => p.activities.length > 0)
})

// 获取活动图片（优先用户上传，其次API获取，最后fallback）
const getActivityImage = (period: 'morning' | 'afternoon' | 'evening', index: number): string => {
  const key = `${period}-${index}`
  
  // 1. 优先从用户上传的图片中获取
  if (activityImages.value[key]) {
    return activityImages.value[key].url
  }
  
  // 2. 从 materialImages 中根据索引分配（简化处理）
  const images = materialImages.value
  if (images.length > 0) {
    const timeline = journeyTimeline.value
    let globalIndex = 0
    
    // 计算全局索引
    for (const p of timeline) {
      if (p.type === period) {
        globalIndex += index
        break
      } else {
        globalIndex += p.activities.length
      }
    }
    
    const imageIndex = globalIndex % images.length
    return images[imageIndex] || ''
  }
  
  return ''
}

const materialImages = computed(() => {
  if (!travel.value?.data?.photos) return []
  
  if (typeof travel.value.data.photos === 'object') {
    const selectedLocation = travel.value.data.selectedLocation
    const photo = selectedLocation ? travel.value.data.photos[selectedLocation] : null
    return photo ? [photo.urls?.regular || photo.url || ''] : []
  }
  
  return Array.isArray(travel.value.data.photos) ? travel.value.data.photos : []
})

// 灵感拼图：用户+AI共建的视觉Moodboard（从数据中获取，不硬编码）
const enrichedMaterials = computed(() => {
  const aiImages = materialImages.value
  const userItems = userMaterialImages.value
  
  // AI生成的图片（来自Unsplash）- 使用简化的视觉诗生成
  const aiItems = aiImages.map((img, index) => {
    // 对于已有图片，使用简化生成（不调用API，仅显示）
    return {
      url: img,
      poetry: '', // 延迟生成或使用占位符
      tags: [], // 延迟提取
      isUserUpload: false
    }
  })
  
  // 合并用户上传和AI生成的图片
  return [...userItems, ...aiItems].slice(0, 12)
})

const companions = computed(() => {
  if (travel.value?.data?.companions) {
    return travel.value.data.companions.map((companion: any, index: number) => ({
      id: companion.id || index + 1,
      name: companion.name || `旅伴${index + 1}`,
      avatar: companion.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${index + 1}`,
      status: companion.status || '探索中',
      notesCount: companion.notesCount || 0,
      index: index
    }))
  }
  return []
})

// AI总结诗（从配置或数据中获取，不硬编码）
const aiSummaryPoem = computed(() => {
  const intentType = travel.value?.data?.detectedIntent?.intentType
  const location = dayExperience.value?.location || selectedLocationName.value
  const templates = summaryPoemTemplates[intentType || 'default'] || summaryPoemTemplates.default
  
  if (Array.isArray(templates)) {
    const template = templates[0]
    return typeof template === 'function' ? template(location) : template
  }
  
  // 如果没有配置，返回空字符串
  return ''
})

// 底部AI语句（从配置或数据中获取，不硬编码）
const echoAIStatement = computed(() => {
  const intentType = travel.value?.data?.detectedIntent?.intentType
  const templates = echoStatementTemplates[intentType || 'default']
  
  if (typeof templates === 'string') {
    return templates
  } else if (Array.isArray(templates)) {
    return templates[0] || ''
  }
  
  // 如果default也是数组，取第一个
  if (Array.isArray(echoStatementTemplates.default)) {
    return echoStatementTemplates.default[0] || ''
  }
  
  // 如果都没有，返回空字符串
  return ''
})

// 方法
const toggleImmersionMode = () => {
  isImmersionMode.value = !isImmersionMode.value
  if (isImmersionMode.value) {
    // 默认从第一个时间段开始
    if (journeyTimeline.value.length > 0) {
      activePeriod.value = journeyTimeline.value[0].type
    } else {
      activePeriod.value = 'morning'
    }
    document.body.style.overflow = 'hidden'
  } else {
    activePeriod.value = null
    activeSound.value = null
    document.body.style.overflow = ''
  }
  playSound(SoundType.CLICK)
}

// 计算是否可以导航到上一个时间段
const canNavigatePrev = computed(() => {
  if (!isImmersionMode.value || !activePeriod.value) return false
  const currentIndex = journeyTimeline.value.findIndex(p => p.type === activePeriod.value)
  return currentIndex > 0
})

// 计算是否可以导航到下一个时间段
const canNavigateNext = computed(() => {
  if (!isImmersionMode.value || !activePeriod.value) return false
  const currentIndex = journeyTimeline.value.findIndex(p => p.type === activePeriod.value)
  return currentIndex >= 0 && currentIndex < journeyTimeline.value.length - 1
})
// 切换到指定时间段
const switchToPeriod = (periodType: 'morning' | 'afternoon' | 'evening') => {
  console.log('switchToPeriod called', {
    periodType,
    isImmersionMode: isImmersionMode.value,
    currentActivePeriod: activePeriod.value
  })
  
  if (!isImmersionMode.value) {
    console.log('Not in immersion mode, returning')
    return
  }
  
  // 停止当前音频
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }
  activeSound.value = null
  
  activePeriod.value = periodType
  console.log('Active period set to:', activePeriod.value)
  playSound(SoundType.CLICK)
  
  // 平滑滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 导航到上一个时间段
const navigateToPrevPeriod = () => {
  console.log('navigateToPrevPeriod called', {
    canNavigatePrev: canNavigatePrev.value,
    activePeriod: activePeriod.value,
    journeyTimeline: journeyTimeline.value.map(p => p.type)
  })
  
  if (!canNavigatePrev.value) {
    console.log('Cannot navigate prev, canNavigatePrev is false')
    return
  }
  
  const currentIndex = journeyTimeline.value.findIndex(p => p.type === activePeriod.value)
  console.log('Current index:', currentIndex)
  
  if (currentIndex > 0) {
    const prevPeriod = journeyTimeline.value[currentIndex - 1]
    console.log('Switching to prev period:', prevPeriod.type)
    switchToPeriod(prevPeriod.type)
  } else {
    console.log('Already at first period')
  }
}

// 导航到下一个时间段
const navigateToNextPeriod = () => {
  console.log('navigateToNextPeriod called', {
    canNavigateNext: canNavigateNext.value,
    activePeriod: activePeriod.value,
    journeyTimeline: journeyTimeline.value.map(p => p.type)
  })
  
  if (!canNavigateNext.value) {
    console.log('Cannot navigate next, canNavigateNext is false')
    return
  }
  
  const currentIndex = journeyTimeline.value.findIndex(p => p.type === activePeriod.value)
  console.log('Current index:', currentIndex, 'Total length:', journeyTimeline.value.length)
  
  if (currentIndex >= 0 && currentIndex < journeyTimeline.value.length - 1) {
    const nextPeriod = journeyTimeline.value[currentIndex + 1]
    console.log('Switching to next period:', nextPeriod.type)
    switchToPeriod(nextPeriod.type)
  } else {
    console.log('Already at last period')
  }
}


const toggleSoundForActivity = (period: 'morning' | 'afternoon' | 'evening', index: number) => {
  const soundKey = `${period}-${index}`
  
  // 停止当前音频
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }
  
  if (activeSound.value === soundKey) {
    activeSound.value = null
  } else {
    activeSound.value = soundKey
    // 播放环境音（简化处理，使用配置文件中的URL）
    const soundUrl = configSoundUrls[period]
    if (soundUrl) {
      const audio = new Audio(soundUrl)
      audio.loop = true
      audio.play().catch(err => console.error('播放音频失败:', err))
      currentAudio.value = audio
    }
  }
  playSound(SoundType.CLICK)
}

// 计算气泡在视口中的实际像素位置
const getBubbleViewportPosition = (index: number): Promise<{ x: number; y: number }> => {
  return new Promise((resolve) => {
    nextTick(() => {
      const bubbleElement = document.querySelector(`[data-bubble-index="${index}"]`) as HTMLElement
      if (bubbleElement) {
        const rect = bubbleElement.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        resolve({ x, y })
      } else {
        // fallback: 使用百分比计算
        const percentX = getMoodBubbleX(index, dynamicMoodItems.value.length)
        const percentY = getMoodBubbleY(index, dynamicMoodItems.value.length)
        const sphereElement = document.querySelector('.floating-mood-sphere') as HTMLElement
        if (sphereElement) {
          const sphereRect = sphereElement.getBoundingClientRect()
          const x = sphereRect.left + (sphereRect.width * percentX / 100)
          const y = sphereRect.top + (sphereRect.height * percentY / 100)
          resolve({ x, y })
        } else {
          resolve({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        }
      }
    })
  })
}

// 调整展开卡片位置，确保完整显示在视口中
const adjustExpandedCardPosition = (position: { x: number; y: number }): { x: number; y: number } => {
  const cardWidth = Math.min(400, window.innerWidth * 0.85)
  const cardMaxHeight = window.innerHeight - 32
  const margin = 16
  
  let { x, y } = position
  y = y + 80 // 从气泡下方展开
  
  // 确保卡片不超出右边界
  if (x + cardWidth / 2 > window.innerWidth - margin) {
    x = window.innerWidth - cardWidth / 2 - margin
  }
  // 确保卡片不超出左边界
  if (x - cardWidth / 2 < margin) {
    x = cardWidth / 2 + margin
  }
  
  // 确保卡片不超出上边界
  if (y < margin) {
    y = margin
  }
  // 确保卡片不超出下边界
  if (y + cardMaxHeight > window.innerHeight - margin) {
    y = window.innerHeight - cardMaxHeight - margin
  }
  
  return { x, y }
}

// 处理气泡点击（展开查看或浏览图片）
const handleBubbleClick = async (mood: any, index: number) => {
  playSound(SoundType.CLICK)
  
  // 标记为已探索
  exploredNodes.value.add(mood.id)
  
  // 如果已展开，则关闭
  if (expandedBubbleId.value === mood.id) {
    expandedBubbleId.value = null
    expandedBubbleData.value = null
    return
  }
  
  // 计算气泡在视口中的实际位置
  const bubblePos = await getBubbleViewportPosition(index)
  const adjustedPos = adjustExpandedCardPosition(bubblePos)
  
  // 展开气泡并显示子内容
  expandedBubbleId.value = mood.id
  expandedBubbleData.value = { mood, index, position: adjustedPos }
  
  // 如果有图片但没有自动搜索，尝试根据关键词搜索
  if ((!mood.images || mood.images.length === 0) && mood.text) {
    try {
      const photos = await searchDestinationPhotos(mood.text, 3)
      const images = photos.map((p: any) => p.urls?.regular || p.url || '').filter(Boolean)
      
      // 更新气泡的图片（如果是自定义标签）
      const customItem = customMoodItems.value.find(c => c.id === mood.id)
      if (customItem) {
        customItem.images = images
      } else {
        // 如果是动态生成的，添加到customMoodItems
        customMoodItems.value.push({
          ...mood,
          images
        })
      }
      
      // 更新展开数据
      if (expandedBubbleData.value && expandedBubbleData.value.mood.id === mood.id) {
        expandedBubbleData.value.mood.images = images
      }
    } catch (error) {
      console.error('搜索图片失败:', error)
    }
  }
  
  // 切换背景图片（如果有）
  if (backgroundImages.value.length > 0) {
    backgroundImageIndex.value = (backgroundImageIndex.value + 1) % backgroundImages.value.length
  }
  
  // 随机切换哲思句
  currentPhilosophyIndex.value = Math.floor(Math.random() * philosophySentences.value.length)
}

// 关闭展开的气泡
const closeExpandedBubble = () => {
  expandedBubbleId.value = null
  expandedBubbleData.value = null
  playSound(SoundType.CLICK)
}

// 监听模态框状态，确保 z-index 正确设置
watch(imageUploadModalVisible, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // 强制设置所有模态框相关的 z-index
      const modalWraps = document.querySelectorAll('.ant-modal-wrap')
      modalWraps.forEach((wrap: Element) => {
        const htmlWrap = wrap as HTMLElement
        htmlWrap.style.zIndex = '20000'
        htmlWrap.style.position = 'fixed'
      })
      
      const modalMasks = document.querySelectorAll('.ant-modal-mask')
      modalMasks.forEach((mask: Element) => {
        const htmlMask = mask as HTMLElement
        htmlMask.style.zIndex = '19999'
        htmlMask.style.position = 'fixed'
      })
      
      const modals = document.querySelectorAll('.ant-modal')
      modals.forEach((modal: Element) => {
        const htmlModal = modal as HTMLElement
        htmlModal.style.zIndex = '20000'
      })
      
      // 强制降低所有可能遮挡的元素
      const expandedCards = document.querySelectorAll('.bubble-expanded-card')
      expandedCards.forEach((card: Element) => {
        const htmlCard = card as HTMLElement
        htmlCard.style.zIndex = '1'
        htmlCard.style.pointerEvents = 'none'
        htmlCard.style.opacity = '0.3'
      })
      
      const journeyTrails = document.querySelectorAll('.journey-trail')
      journeyTrails.forEach((trail: Element) => {
        const htmlTrail = trail as HTMLElement
        htmlTrail.style.zIndex = '1'
        htmlTrail.style.pointerEvents = 'none'
        htmlTrail.style.opacity = '0.3'
      })
    })
  } else {
    // 恢复展开卡片和旅程轨迹的样式
    nextTick(() => {
      const expandedCards = document.querySelectorAll('.bubble-expanded-card')
      expandedCards.forEach((card: Element) => {
        const htmlCard = card as HTMLElement
        htmlCard.style.zIndex = ''
        htmlCard.style.pointerEvents = ''
        htmlCard.style.opacity = ''
      })
      
      const journeyTrails = document.querySelectorAll('.journey-trail')
      journeyTrails.forEach((trail: Element) => {
        const htmlTrail = trail as HTMLElement
        htmlTrail.style.zIndex = ''
        htmlTrail.style.pointerEvents = ''
        htmlTrail.style.opacity = ''
      })
    })
  }
})

// 为气泡添加图片（上传）
const handleBubbleImageUpload = (moodId: string) => {
  // 确保设置 editingBubbleId 后再打开模态框
  editingBubbleId.value = moodId
  
  // 更新展开数据中的图片数组，确保图片能正确显示
  if (expandedBubbleData.value && expandedBubbleData.value.mood.id === moodId) {
    // 查找对应的气泡数据，更新图片列表
    const bubble = customMoodItems.value.find(b => b.id === moodId)
    if (bubble && bubble.images) {
      expandedBubbleData.value.mood.images = bubble.images
    } else {
      const moodItem = dynamicMoodItems.value.find(m => m.id === moodId)
      if (moodItem) {
        const existingCustom = customMoodItems.value.find(c => c.id === moodItem.id)
        if (existingCustom && existingCustom.images) {
          expandedBubbleData.value.mood.images = existingCustom.images
        } else if (moodItem.images) {
          expandedBubbleData.value.mood.images = moodItem.images
        }
      }
    }
  }
  
  openImageUploadModal()
  playSound(SoundType.CLICK)
}

// 显示添加新标签模态框
const showAddMoodItemModal = () => {
  // 使用简单的prompt（可以后续改为更美观的模态框）
  const text = prompt('请输入标签文字（最多4个字）:')
  if (text && text.trim()) {
    const newId = `custom-${Date.now()}`
    const newItem = {
      id: newId,
      icon: getIconByKeyword(text.trim()),
      text: text.trim().substring(0, 4),
      images: []
    }
    customMoodItems.value.push(newItem)
    playSound(SoundType.SUCCESS)
    
    // 自动打开图片上传
    editingBubbleId.value = newId
    openImageUploadModal()
  }
}

const generateVisualCollage = async (mood: any, index: number) => {
  playSound(SoundType.CLICK)
  // 根据关键词搜索相关图片
  try {
    const keyword = mood.text || mood.keyword || ''
    const photos = await searchDestinationPhotos(keyword, 4)
    const images = photos.map((p: any) => p.urls?.regular || p.url || '').filter(Boolean)
    
    if (images.length > 0) {
      activeCollage.value = {
        title: `${mood.text}的视觉拼贴`,
        images
      }
    } else {
      // 如果没有搜索到图片，使用现有图片
      activeCollage.value = {
        title: `${mood.text}的视觉拼贴`,
        images: floatingImages.value.slice(0, 4)
      }
    }
  } catch (error) {
    console.error('生成视觉拼贴失败:', error)
    // 使用现有图片作为fallback
    activeCollage.value = {
      title: `${mood.text}的视觉拼贴`,
      images: floatingImages.value.slice(0, 4)
    }
  }
}

const closeCollage = () => {
  activeCollage.value = null
  playSound(SoundType.CLICK)
}

// 计算气泡位置（圆形分布）
const getMoodBubbleX = (index: number, total: number): number => {
  if (total === 1) return 50
  if (total === 2) return index === 0 ? 25 : 75
  if (total === 3) {
    const angles = [90, 210, 330] // 顶部、左下、右下
    return 50 + 30 * Math.cos((angles[index] * Math.PI) / 180)
  }
  // 4个或更多：圆形分布
  const angle = (index / total) * 360
  return 50 + 35 * Math.cos((angle * Math.PI) / 180)
}

const getMoodBubbleY = (index: number, total: number): number => {
  if (total === 1) return 50
  if (total === 2) return 50
  if (total === 3) {
    const angles = [90, 210, 330]
    return 50 + 30 * Math.sin((angles[index] * Math.PI) / 180)
  }
  // 4个或更多：圆形分布
  const angle = (index / total) * 360
  return 50 + 35 * Math.sin((angle * Math.PI) / 180)
}

// 计算气泡连接线（形成探索网络）
const getBubbleConnections = () => {
  const items = dynamicMoodItems.value
  if (items.length < 2) return []
  
  const connections: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  
  // 连接相邻节点（形成环形）
  for (let i = 0; i < items.length; i++) {
    const nextIndex = (i + 1) % items.length
    const x1 = getMoodBubbleX(i, items.length)
    const y1 = getMoodBubbleY(i, items.length)
    const x2 = getMoodBubbleX(nextIndex, items.length)
    const y2 = getMoodBubbleY(nextIndex, items.length)
    
    connections.push({ x1, y1, x2, y2 })
  }
  
  // 对于3个或更多节点，还可以连接中心点（可选）
  if (items.length >= 3) {
    // 连接第一个和中心附近的节点
    const centerX = 50
    const centerY = 50
    connections.push({
      x1: getMoodBubbleX(0, items.length),
      y1: getMoodBubbleY(0, items.length),
      x2: centerX,
      y2: centerY
    })
  }
  
  return connections
}

const handleInspirationInput = debounce(() => {
  if (userInspirationInput.value.trim()) {
    generateAIFeedback(userInspirationInput.value)
  }
}, 800)

const handleInputFocus = () => {
  playSound(SoundType.CLICK)
}

// 生成AI反馈（根据意图类型使用不同模板）
const generateAIFeedback = async (input: string) => {
  isAIGenerating.value = true
  
  try {
    // 根据意图类型选择模板
    const intentType = travel.value?.data?.detectedIntent?.intentType
    const templates = aiFeedbackTemplates || []
    
    // 模拟AI生成延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (templates.length > 0 && typeof templates[0] === 'function') {
      aiFeedback.value = templates[0](input)
    } else if (templates.length > 0) {
      // 如果不是函数，直接使用模板
      aiFeedback.value = typeof templates[0] === 'string' ? templates[0] : ''
    } else {
      // 如果没有模板，返回空字符串
      aiFeedback.value = ''
    }
    
    playSound(SoundType.SUCCESS)
  } catch (error) {
    console.error('生成AI反馈失败:', error)
    aiFeedback.value = ''
  } finally {
    isAIGenerating.value = false
  }
}

const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    await processImageFiles(Array.from(event.dataTransfer.files))
  }
}

const handleUploadClick = (index: number) => {
  uploadingIndex.value = index
  openImageUploadModal()
}

// 打开图片上传模态框
const openImageUploadModal = () => {
  // 立即强制降低展开卡片的 z-index，确保模态框显示在最上层
  const expandedCards = document.querySelectorAll('.bubble-expanded-card')
  expandedCards.forEach((card: Element) => {
    const htmlCard = card as HTMLElement
    htmlCard.style.zIndex = '1'
    htmlCard.style.pointerEvents = 'none'
    htmlCard.style.opacity = '0.3'
  })
  
  // 不关闭展开的气泡卡片，只确保模态框在最上层
  imageUploadModalVisible.value = true
  uploadModalMode.value = 'upload'
  unsplashSearchQuery.value = ''
  unsplashSearchResults.value = []
  selectedUnsplashPhotos.value = []
  
  // 使用 nextTick 和延迟确保 DOM 完全更新后再强制设置 z-index
  nextTick(() => {
    setTimeout(() => {
      const modalWraps = document.querySelectorAll('.ant-modal-wrap')
      modalWraps.forEach((wrap: Element) => {
        const htmlWrap = wrap as HTMLElement
        if (htmlWrap.style.display !== 'none') {
          htmlWrap.style.zIndex = '20000'
          htmlWrap.style.position = 'fixed'
          htmlWrap.style.top = '0'
          htmlWrap.style.left = '0'
          htmlWrap.style.right = '0'
          htmlWrap.style.bottom = '0'
        }
      })
      
      const modalMasks = document.querySelectorAll('.ant-modal-mask')
      modalMasks.forEach((mask: Element) => {
        const htmlMask = mask as HTMLElement
        if (htmlMask.style.display !== 'none') {
          htmlMask.style.zIndex = '19999'
          htmlMask.style.position = 'fixed'
          htmlMask.style.top = '0'
          htmlMask.style.left = '0'
          htmlMask.style.right = '0'
          htmlMask.style.bottom = '0'
        }
      })
      
      const modals = document.querySelectorAll('.ant-modal')
      modals.forEach((modal: Element) => {
        const htmlModal = modal as HTMLElement
        htmlModal.style.zIndex = '20000'
        htmlModal.style.position = 'fixed'
      })
      
      // 再次强制降低展开卡片
      const expandedCardsAgain = document.querySelectorAll('.bubble-expanded-card')
      expandedCardsAgain.forEach((card: Element) => {
        const htmlCard = card as HTMLElement
        htmlCard.style.zIndex = '1'
        htmlCard.style.pointerEvents = 'none'
        htmlCard.style.opacity = '0.3'
      })
      
      const journeyTrails = document.querySelectorAll('.journey-trail')
      journeyTrails.forEach((trail: Element) => {
        const htmlTrail = trail as HTMLElement
        htmlTrail.style.zIndex = '1'
        htmlTrail.style.pointerEvents = 'none'
        htmlTrail.style.opacity = '0.3'
      })
    }, 100)
  })
}

// 关闭图片上传模态框
const closeImageUploadModal = () => {
  imageUploadModalVisible.value = false
  isDragging.value = false
  editingBubbleId.value = null
}

// Tab切换处理
const handleTabChange = (key: string) => {
  uploadModalMode.value = key as 'upload' | 'search'
  if (key === 'search' && !unsplashSearchQuery.value) {
    // 默认搜索当前目的地
    unsplashSearchQuery.value = selectedLocationName.value
    if (unsplashSearchQuery.value) {
      handleUnsplashSearch(unsplashSearchQuery.value)
    }
  }
}

// Unsplash搜索
const handleUnsplashSearch = async (query: string) => {
  if (!query.trim()) {
    message.warning('请输入搜索关键词')
    return
  }

  isSearching.value = true
  selectedUnsplashPhotos.value = []
  
  try {
    // 翻译关键词为英文
    const translatedQuery = translateDestination(query)
    const photos = await searchDestinationPhotos(translatedQuery, 20)
    
    unsplashSearchResults.value = photos
    
    if (photos.length === 0) {
      message.info('未找到相关图片，请尝试其他关键词')
  } else {
      playSound(SoundType.SUCCESS)
    }
  } catch (error) {
    console.error('搜索图片失败:', error)
    message.error('搜索图片失败，请稍后重试')
    playSound(SoundType.ERROR)
  } finally {
    isSearching.value = false
  }
}

// 切换图片选择状态
const togglePhotoSelection = (photoId: string) => {
  const index = selectedUnsplashPhotos.value.indexOf(photoId)
  if (index > -1) {
    selectedUnsplashPhotos.value.splice(index, 1)
  } else {
    if (selectedUnsplashPhotos.value.length < 10) {
      selectedUnsplashPhotos.value.push(photoId)
      playSound(SoundType.CLICK)
    } else {
      message.warning('最多只能选择10张图片')
    }
  }
}

// 添加选中的Unsplash图片（支持添加到气泡或素材区）
const addSelectedUnsplashPhotos = async () => {
  if (selectedUnsplashPhotos.value.length === 0) {
    message.warning('请至少选择一张图片')
    return
  }

  try {
    const imageUrls: string[] = []
    
    for (const photoId of selectedUnsplashPhotos.value) {
      const photo = unsplashSearchResults.value.find(p => p.id === photoId)
      if (photo) {
        const imageUrl = photo.urls.regular || photo.urls.full
        imageUrls.push(imageUrl)
        
        // 如果是为气泡添加图片，直接添加到气泡的images数组
        if (editingBubbleId.value) {
          const bubble = customMoodItems.value.find(b => b.id === editingBubbleId.value)
          if (bubble) {
            if (!bubble.images) {
              bubble.images = []
            }
            bubble.images.push(imageUrl)
            // 更新展开数据中的图片
            if (expandedBubbleData.value && expandedBubbleData.value.mood.id === editingBubbleId.value) {
              expandedBubbleData.value.mood.images = [...bubble.images]
            }
          } else {
            // 如果是动态生成的标签，找到对应的标签并添加到customMoodItems
            const moodItem = dynamicMoodItems.value.find(m => m.id === editingBubbleId.value)
            if (moodItem) {
              // 添加到自定义标签列表或更新已有标签
              const existingCustom = customMoodItems.value.find(c => c.id === moodItem.id)
              if (existingCustom) {
                if (!existingCustom.images) {
                  existingCustom.images = []
                }
                existingCustom.images.push(imageUrl)
                // 更新展开数据中的图片
                if (expandedBubbleData.value && expandedBubbleData.value.mood.id === editingBubbleId.value) {
                  expandedBubbleData.value.mood.images = [...existingCustom.images]
                }
              } else {
                const newCustom = {
                  ...moodItem,
                  images: [imageUrl]
                }
                customMoodItems.value.push(newCustom)
                // 更新展开数据中的图片
                if (expandedBubbleData.value && expandedBubbleData.value.mood.id === editingBubbleId.value) {
                  expandedBubbleData.value.mood.images = [imageUrl]
                }
              }
            }
          }
        } else {
          // 否则添加到素材收集区
          const poetry = await generatePoetryForImage(imageUrl, photo)
          const tags = await extractTagsFromPoetry(imageUrl, photo)
          
          userMaterialImages.value.push({
            url: imageUrl,
            poetry,
            tags,
            isUserUpload: false
          })
        }
      }
    }
    
    message.success(`成功添加 ${selectedUnsplashPhotos.value.length} 张图片`)
    playSound(SoundType.SUCCESS)
    
    // 清空选择，但保持编辑状态，允许继续添加
    selectedUnsplashPhotos.value = []
    // 不关闭模态框，允许继续上传
    // editingBubbleId.value = null
    // closeImageUploadModal()
  } catch (error) {
    console.error('添加图片失败:', error)
    message.error('添加图片失败，请稍后重试')
    playSound(SoundType.ERROR)
  }
}

// 模态框内的拖拽处理
const handleModalDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    await processMaterialImages(Array.from(event.dataTransfer.files))
    closeImageUploadModal()
  }
}

const selectTheme = (themeValue: string) => {
  selectedTheme.value = themeValue
  playSound(SoundType.CLICK)
}

const startEditSummary = () => {
  editingSummary.value = true
  editableSummary.value = aiSummaryText.value
  playSound(SoundType.CLICK)
}

const saveSummary = () => {
  // TODO: 保存到 travel.value?.data 中
  editingSummary.value = false
  playSound(SoundType.SUCCESS)
  // 保存逻辑：更新 travel 数据
  if (travel.value?.data) {
    const selectedLocation = selectedLocationName.value
    if (selectedLocation && travel.value.data.locationDetails?.[selectedLocation]) {
      travel.value.data.locationDetails[selectedLocation].aiMessage = editableSummary.value
    } else {
      travel.value.data.aiMessage = editableSummary.value
    }
  }
}

const cancelEditSummary = () => {
  editingSummary.value = false
  editableSummary.value = ''
  playSound(SoundType.CLICK)
}

const startEditActivity = (period: 'morning' | 'afternoon' | 'evening', index: number) => {
  const timeline = journeyTimeline.value
  const periodData = timeline.find(p => p.type === period)
  const activity = periodData?.activities[index]
  
  if (activity) {
    editingActivity.value = { period, index }
    editableActivity.value = {
      time: activity.time,
      title: activity.activity,
      description: activity.narration || activity.aiNarration || ''
    }
  }
  playSound(SoundType.CLICK)
}

const saveActivity = (period: 'morning' | 'afternoon' | 'evening', index: number) => {
  // TODO: 保存到 travel.value?.data.experiences[location].timeline 中
  // 这里简化处理，实际应该更新 travel 数据
  editingActivity.value = null
  editableActivity.value = { time: '', title: '', description: '' }
  playSound(SoundType.SUCCESS)
}

const cancelEditActivity = () => {
  editingActivity.value = null
  editableActivity.value = { time: '', title: '', description: '' }
  playSound(SoundType.CLICK)
}

const handleActivityImageUpload = (period: 'morning' | 'afternoon' | 'evening', index: number) => {
  uploadingActivityPeriod.value = period
  uploadingActivityIndex.value = index
  fileInputRef.value?.click()
}
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return
  
  try {
    if (uploadingActivityPeriod.value !== null) {
      // 处理活动图片上传
      await processActivityImage(files[0])
    } else {
      // 处理素材图片上传
      await processMaterialImages(files)
    }
  } catch (error) {
    console.error('文件处理失败:', error)
  } finally {
    // 重置状态
    target.value = ''
    uploadingActivityPeriod.value = null
    uploadingActivityIndex.value = -1
    uploadingIndex.value = -1
  }
}

const processActivityImage = async (file: File) => {
  if (uploadingActivityPeriod.value === null || uploadingActivityIndex.value === -1) return
  
  try {
    const base64 = await fileToBase64(file)
    const key = `${uploadingActivityPeriod.value}-${uploadingActivityIndex.value}`
    activityImages.value[key] = { url: base64 }
    playSound(SoundType.SUCCESS)
    
    // TODO: 保存到 travel.value?.data 中
  } catch (error) {
    console.error('活动图片处理失败:', error)
    playSound(SoundType.ERROR)
  }
}

// 处理素材图片上传（生成AI视觉诗，支持添加到气泡）
const processMaterialImages = async (files: File[]) => {
  const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 10)
  
  for (const file of imageFiles) {
    try {
      const base64 = await fileToBase64(file)
      
      // 如果是为气泡添加图片
      if (editingBubbleId.value) {
        const bubble = customMoodItems.value.find(b => b.id === editingBubbleId.value)
        if (bubble) {
          if (!bubble.images) {
            bubble.images = []
          }
          bubble.images.push(base64)
          // 更新展开数据中的图片
          if (expandedBubbleData.value && expandedBubbleData.value.mood.id === editingBubbleId.value) {
            expandedBubbleData.value.mood.images = [...bubble.images]
          }
        } else {
          // 如果是动态生成的标签
          const moodItem = dynamicMoodItems.value.find(m => m.id === editingBubbleId.value)
          if (moodItem) {
            const existingCustom = customMoodItems.value.find(c => c.id === moodItem.id)
            if (existingCustom) {
              if (!existingCustom.images) {
                existingCustom.images = []
              }
              existingCustom.images.push(base64)
              // 更新展开数据中的图片
              if (expandedBubbleData.value && expandedBubbleData.value.mood.id === editingBubbleId.value) {
                expandedBubbleData.value.mood.images = [...existingCustom.images]
              }
            } else {
              const newCustom = {
                ...moodItem,
                images: [base64]
              }
              customMoodItems.value.push(newCustom)
              // 更新展开数据中的图片
              if (expandedBubbleData.value && expandedBubbleData.value.mood.id === editingBubbleId.value) {
                expandedBubbleData.value.mood.images = [base64]
              }
            }
          }
        }
        playSound(SoundType.SUCCESS)
      } else {
        // 否则添加到素材收集区
        const poetry = await generatePoetryForImage(base64)
        const tags = await extractTagsFromPoetry(base64)
        
        userMaterialImages.value.push({
          url: base64,
          poetry,
          tags,
          isUserUpload: true
        })
        
        playSound(SoundType.SUCCESS)
      }
    } catch (error) {
      console.error('处理素材图片失败:', error)
    }
  }
  
  // 如果是为气泡添加，不清空编辑状态，允许继续上传
  // 保持 editingBubbleId 和模态框打开，用户可以继续上传
}

// 为上传的图片生成AI视觉诗（使用新的提示语生成器）
const generatePoetryForImage = async (imageBase64OrUrl: string, photoData?: UnsplashPhoto): Promise<string> => {
  try {
    // 如果是Unsplash图片，使用photoData
    if (photoData) {
      const poetryResult = await generatePhotoPoetry(
        photoData.urls?.regular || imageBase64OrUrl,
        photoData.description,
        photoData.color,
        travel.value?.data?.detectedIntent?.intentType
      )
      // 返回格式化的提示语字符串
      return formatPoetryDisplay(poetryResult)
    } else {
      // 用户上传的图片（base64），无法分析，使用简化处理
      const intentType = travel.value?.data?.detectedIntent?.intentType
      const poetryResult = await generatePhotoPoetry(
        imageBase64OrUrl,
        null,
        undefined,
        intentType
      )
      return formatPoetryDisplay(poetryResult)
    }
  } catch (error) {
    console.error('生成视觉诗失败:', error)
    return ''
  }
}

// 从视觉诗结果中提取标签（从PoetryResult中获取，不硬编码）
const extractTagsFromPoetry = async (imageBase64OrUrl: string, photoData?: UnsplashPhoto): Promise<string[]> => {
  try {
    // 使用新的生成器获取完整结果
    if (photoData) {
      const poetryResult = await generatePhotoPoetry(
        photoData.urls?.regular || imageBase64OrUrl,
        photoData.description,
        photoData.color,
        travel.value?.data?.detectedIntent?.intentType
      )
      return poetryResult.tags
    } else {
      const intentType = travel.value?.data?.detectedIntent?.intentType
      const poetryResult = await generatePhotoPoetry(
        imageBase64OrUrl,
        null,
        undefined,
        intentType
      )
      return poetryResult.tags
    }
  } catch (error) {
    console.error('提取标签失败:', error)
    return []
  }
}

const handleDeleteImage = (index: number) => {
  // 只允许删除用户上传的图片
  const image = enrichedMaterials.value[index]
  if (image && image.isUserUpload) {
    userMaterialImages.value = userMaterialImages.value.filter((_, i) => {
      // 找到对应的用户上传图片索引
      const userUploadIndex = userMaterialImages.value.findIndex(img => img.url === image.url)
      return i !== userUploadIndex
    })
    playSound(SoundType.CLICK)
  } else {
    // AI生成的图片不能删除，可以提示
    playSound(SoundType.ERROR)
  }
}

const handleExtendInspiration = () => {
  playSound(SoundType.INSPIRATION_EXTEND)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleConvertToTrip = async () => {
  playSound(SoundType.TRIP_CONVERT)
  console.log('转换为行程规划')
  // 转换逻辑
}

// 获取旅伴留言（从数据中获取，不硬编码）
const getCompanionMessage = (companion: any): string => {
  // 优先从companion数据中获取message或notes
  if (companion.message) return companion.message
  if (companion.notes && companion.notes.length > 0) {
    return companion.notes[0].content || companion.notes[0].text || ''
  }
  // 如果没有数据，返回空字符串（不应该显示默认消息）
  return ''
}

const viewCompanionNotes = (companion: any) => {
  playSound(SoundType.COMPANION_MESSAGE)
  console.log('查看旅伴笔记:', companion)
  // TODO: 打开旅伴详情对话框
}

// 格式化主提示语（提取主提示语部分）
const formatMainPrompt = (poetry: string): string => {
  if (!poetry) return ''
  // 提取主提示语："XXXX"
  const mainPromptMatch = poetry.match(/主提示语："([^"]+)"/)
  if (mainPromptMatch && mainPromptMatch[1]) {
    return mainPromptMatch[1]
  }
  // 如果没有匹配到，尝试提取第一行作为主提示语
  const lines = poetry.split('\n')
  const firstLine = lines.find(line => line.trim() && !line.includes('主提示语') && !line.includes('补充句') && !line.includes('主题标签'))
  return firstLine ? firstLine.replace(/^[""]|[""]$/g, '').trim() : ''
}

// 格式化补充句（提取补充句部分）
const formatExtendedSentence = (poetry: string): string => {
  if (!poetry) return ''
  // 提取补充句："XXXX"
  const extendedMatch = poetry.match(/补充句："([^"]+)"/)
  if (extendedMatch && extendedMatch[1]) {
    return extendedMatch[1]
  }
  // 如果没有匹配到，尝试提取包含"补充句"的行
  const lines = poetry.split('\n')
  const extendedLine = lines.find(line => line.includes('补充句') && line.includes('"'))
  if (extendedLine) {
    const match = extendedLine.match(/"([^"]+)"/)
    return match ? match[1] : ''
  }
  return ''
}

// 工具函数
const processImageFiles = async (files: File[]) => {
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  if (imageFiles.length === 0) return
  
  for (const file of imageFiles.slice(0, 10)) {
    try {
      const base64 = await fileToBase64(file)
      console.log('处理图片:', base64.substring(0, 50))
    } catch (error) {
      console.error('处理图片失败:', error)
    }
  }
}

// 生命周期
onMounted(() => {
  // 加载已保存的用户反思
  const travelId = route.params.id as string
  const storageKey = `travelReflections_${travelId}`
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      userReflections.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载已保存的反思失败:', error)
  }
  
  // Hero滚动监听：更新当前阶段高亮
  window.addEventListener('scroll', updateCurrentStage, { passive: true })
  updateCurrentStage()
  
  // 加载已完成的动作
  const saved = localStorage.getItem(`completedActions_${route.params.id}`)
  if (saved) {
    try {
      completedActions.value = new Set(JSON.parse(saved))
    } catch (e) {
      console.warn('加载完成动作失败:', e)
    }
  }
  
  // 加载镜湖操作完成状态
  const savedMirror = localStorage.getItem(`mirrorActions_${route.params.id}`)
  if (savedMirror) {
    try {
      completedMirrorActions.value = new Set(JSON.parse(savedMirror))
    } catch (e) {
      console.warn('加载镜湖操作失败:', e)
    }
  }
  
  // 加载感受记录
  const savedRecords = localStorage.getItem(`feelingRecords_${route.params.id}`)
  if (savedRecords) {
    try {
      allRecords.value = JSON.parse(savedRecords)
    } catch (e) {
      console.warn('加载感受记录失败:', e)
    }
  }
  
  // 初始化Intersection Observer用于滚动触发
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    // 观察视觉诗项目
    const poetryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-poetry-index') || '0')
          if (entry.isIntersecting) {
            visiblePoetryItems.value.add(index)
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '50px'
      }
    )
    
    // 观察所有moodboard项目
    const items = document.querySelectorAll('[data-poetry-index]')
    items.forEach((item) => poetryObserver.observe(item))
    
    // 观察目的地卡片
    const destinationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-destination-index') || '0')
          if (entry.isIntersecting) {
            visibleDestinationCards.value.add(index)
          }
        })
      },
      {
        threshold: 0.5,
        rootMargin: '100px'
      }
    )
    
    setTimeout(() => {
      const destinationItems = document.querySelectorAll('[data-destination-index]')
      destinationItems.forEach((item) => destinationObserver.observe(item))
    }, 100)
    
    // 观察气泡（用于滚动动效）
    const bubbleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('bubble-visible')
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '50px'
      }
    )
    
    setTimeout(() => {
      const bubbles = document.querySelectorAll('[data-bubble-index]')
      bubbles.forEach((bubble) => {
        // 立即添加 bubble-visible class，确保气泡可见
        bubble.classList.add('bubble-visible')
        bubbleObserver.observe(bubble)
      })
    }, 100)
    
    // 观察觉醒的巅峰阶段，自动激活
    const awakeningObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isAwakeningPeakActive.value) {
            // 当觉醒阶段进入视窗时自动激活
            activateAwakeningPeak()
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '50px'
      }
    )
    
    setTimeout(() => {
      const awakeningStage = awakeningPeakStageRef.value
      if (awakeningStage) {
        awakeningObserver.observe(awakeningStage)
      }
    }, 500)
    
    // 视差滚动效果
    const handleParallaxScroll = () => {
      const container = document.querySelector('[data-parallax-container]')
      if (!container) return
      
      const scrollY = window.scrollY
      const containerTop = (container as HTMLElement).offsetTop
      const containerHeight = (container as HTMLElement).offsetHeight
      const relativeScroll = scrollY - containerTop + window.innerHeight / 2
      
      const parallaxItems = document.querySelectorAll('[data-parallax-index]')
      parallaxItems.forEach((item: Element, index: number) => {
        const speed = 0.3 + index * 0.15
        const delay = index * 0.2
        const zLayer = index
        const translateY = (relativeScroll * speed * 0.1) + (delay * 20)
        const translateZ = zLayer * -10
        
        ;(item as HTMLElement).style.transform = `
          translate(-50%, -50%) 
          translateY(${translateY}px) 
          translateZ(${translateZ}px)
          rotate(calc(var(--rotation) + ${relativeScroll * 0.01}deg))
        `
      })
    }
    
    window.addEventListener('scroll', handleParallaxScroll, { passive: true })
    
    // 沉浸模式键盘快捷键支持
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isImmersionMode.value) return
      
      // 左右箭头键切换时间段
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateToPrevPeriod()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateToNextPeriod()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    // 保存observers和handlers以便清理
    ;(window as any).__poetryObserver = poetryObserver
    ;(window as any).__destinationObserver = destinationObserver
    ;(window as any).__bubbleObserver = bubbleObserver
    ;(window as any).__parallaxHandler = handleParallaxScroll
    ;(window as any).__immersionKeyHandler = handleKeyPress
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateCurrentStage)
  // 清理背景音频
  if (backgroundSoundAudio.value) {
    backgroundSoundAudio.value.pause()
    backgroundSoundAudio.value = null
  }
  
  // 清理当前音频
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }
  
  // 清理Intersection Observers
  if ((window as any).__poetryObserver) {
    ;(window as any).__poetryObserver.disconnect()
    delete (window as any).__poetryObserver
  }
  if ((window as any).__destinationObserver) {
    ;(window as any).__destinationObserver.disconnect()
    delete (window as any).__destinationObserver
  }
  if ((window as any).__bubbleObserver) {
    ;(window as any).__bubbleObserver.disconnect()
    delete (window as any).__bubbleObserver
  }
  if ((window as any).__parallaxHandler) {
    window.removeEventListener('scroll', (window as any).__parallaxHandler)
    delete (window as any).__parallaxHandler
  }
  if ((window as any).__immersionKeyHandler) {
    window.removeEventListener('keydown', (window as any).__immersionKeyHandler)
    delete (window as any).__immersionKeyHandler
  }
  
  // 清理觉醒巅峰观察器
  if ((window as any).__awakeningObserver) {
    ;(window as any).__awakeningObserver.disconnect()
    delete (window as any).__awakeningObserver
  }
  
  // 恢复滚动
  document.body.style.overflow = ''
  
  // 停止觉醒时刻音频
  if (awakeningAudio.value) {
    awakeningAudio.value.pause()
    awakeningAudio.value = null
  }
  if (heartbeatAudio.value) {
    heartbeatAudio.value.pause()
    heartbeatAudio.value = null
  }
})
</script>

<style scoped>
/* ===== Apple风格设计系统 ===== */
.experience-day {
  /* 颜色系统 - Apple风格 */
  --color-primary: #007AFF;
  --color-secondary: #5856D6;
  --color-accent: #FF3B30;
  --color-success: #34C759;
  
  /* 文本颜色 */
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --text-tertiary: #AEAFB2;
  
  /* 背景颜色 */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F7;
  --bg-tertiary: #E8E8ED;
  
  /* 边框 */
  --border-color: rgba(0, 0, 0, 0.1);
  --border-light: rgba(0, 0, 0, 0.06);
  
  /* 玻璃态效果 */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-blur: 20px;
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-saturate: 180%;
  
  /* 阴影系统 - Apple风格细腻阴影 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.16);
  
  /* 圆角系统 */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-2xl: 28px;
  --radius-pill: 9999px;
  
  /* 间距系统 */
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  
  /* 字体系统 */
  --font-title: clamp(1.75rem, 4vw, 2.5rem);
  --font-heading: clamp(1.5rem, 3vw, 2rem);
  --font-subheading: clamp(1.125rem, 2.5vw, 1.5rem);
  --font-body: 1rem;
  --font-small: 0.875rem;
  --font-tiny: 0.75rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* 动画系统 - Apple风格缓动 */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  --transition-fast: 150ms var(--ease-out);
  --transition-base: 250ms var(--ease-out);
  --transition-slow: 350ms var(--ease-out);
  
  /* 兼容旧变量 */
  --card-bg: var(--glass-bg);
  --card-blur: var(--glass-blur);
  --card-radius: var(--radius-lg);
  --card-shadow: var(--shadow-md);
  --h2: var(--font-heading);
  --text-strong: var(--text-primary);
  --text-sub: var(--text-secondary);
  --body: var(--font-body);
  --line: var(--border-light);
  --space-4: var(--space-md);
  --space-5: 1.25rem;
  --space-7: var(--space-xl);
  --dur: var(--transition-base);
  --ease: var(--ease-out);
  --chip: #F0F4FF;
  --chip-border: #D0DCE8;
  --chip-text: #1D4ED8;
  --chip-active: var(--color-primary);
  --accent: var(--color-accent);
  
  /* 布局 */
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  width: 100%;
  min-height: 100vh;
  padding: var(--space-xl) var(--space-md);
  position: relative;
  background: var(--bg-secondary);
}

/* ===== 统一阶段卡片样式 - Apple风格 ===== */
.stage-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: 
    var(--shadow-md),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  padding: var(--space-3xl);
  max-width: 1024px;
  margin: 0 auto;
  width: 100%;
  scroll-margin-top: 80px;
  scroll-behavior: smooth;
  position: relative;
  transition: all var(--transition-base);
}

.stage-card:hover {
  box-shadow: 
    var(--shadow-lg),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .stage-card {
    scroll-behavior: auto;
  }
  .stage-head h3::after {
    display: none;
  }
}

@media (max-width: 768px) {
  .stage-card {
    padding: var(--space-5);
    margin: 1rem auto;
  }
}

.stage-head h3 {
  font-size: var(--font-heading);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm);
  position: relative;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stage-head h3::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--text-strong);
  opacity: 0;
  transition: width 1.5s ease-out, opacity 1.5s ease-out;
}

/* 滚动锚点吸附后，标题下划线淡入 */
.stage-card:target .stage-head h3::after,
.stage-card.scrolled-to .stage-head h3::after {
  width: 80px;
  opacity: 0.3;
}

.stage-head .sub {
  color: var(--text-secondary);
  margin: 0 0 var(--space-xl);
  font-size: var(--font-subheading);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  list-style: none;
  padding: 0;
  margin: 0;
}

.action-item {
  position: relative;
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: var(--space-md);
  min-height: 80px;
  padding: var(--space-lg) var(--space-xl);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
}

.action-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-color);
}

.action-item:active {
  transform: translateY(-1px) scale(0.98);
}

.action-item.completed {
  background: rgba(230, 250, 240, 0.8);
  border-color: rgba(56, 239, 125, 0.3);
}

.action-item .icon {
  font-size: 28px;
  line-height: 1;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.action-item .meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.action-item .title {
  font-size: var(--font-subheading);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-item .desc {
  font-size: var(--font-body);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pill {
  height: 36px;
  min-width: 80px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-pill);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--color-primary);
  font-size: var(--font-small);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-xs);
}

.pill:hover {
  background: var(--bg-secondary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.pill:active {
  transform: translateY(-1px) scale(0.98);
}

.pill:focus-visible {
  outline: 2px solid #274C9C;
  outline-offset: 2px;
}

.action-item.completed .pill {
  background: rgba(56, 239, 125, 0.15);
  border-color: rgba(56, 239, 125, 0.4);
  color: #095e54;
}

.check-mark {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  min-width: 32px;
  background: linear-gradient(135deg, rgba(254, 50, 50, 0.9), rgba(254, 50, 50, 0.7));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(254, 50, 50, 0.4);
  animation: checkGlow 0.6s ease;
  z-index: 10;
}

.check-glow-enter-active { transition: all 0.3s ease; }
.check-glow-enter-from { transform: scale(0); opacity: 0; }

@keyframes checkGlow {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* ===== 三卡操作区（统一风格） ===== */
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin: 2rem 0;
}

.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-sm);
  min-height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

/* 三卡底各自极淡渐变区分 */
.card:nth-child(1)::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(56, 239, 125, 0.08), transparent);
}

.card:nth-child(2)::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(255, 182, 193, 0.08), transparent);
}

.card:nth-child(3)::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.08), transparent);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-color);
}

.card:active {
  transform: translateY(-3px) scale(0.98);
}

.card.completed {
  background: rgba(230, 250, 240, 0.9);
  border-color: rgba(56, 239, 125, 0.3);
}

.card .head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.card .head .emoji {
  font-size: 28px;
  line-height: 1;
  width: 28px;
  text-align: center;
}

.card h4 {
  font-size: var(--font-subheading);
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.card .lines {
  color: var(--text-sub);
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
  flex: 1;
  min-height: 0;
}

.card .lines .instruction {
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card .lines .benefit {
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
  color: #6B7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card .meta {
  display: flex;
  gap: 14px;
  color: #6B7280;
  font-size: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.card .cta {
  align-self: flex-start;
  margin-top: auto;
}

.btn-outline {
  height: 44px;
  min-width: 120px;
  padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: var(--shadow-xs);
}

.btn-outline:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-outline:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-outline:focus-visible {
  outline: 2px solid #1F2A44;
  outline-offset: 2px;
}

.btn-outline.btn-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(254, 50, 50, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple 0.6s ease-out;
}

/* ===== 种子沉淀编辑卡 ===== */
.seed-edit-card {
  margin: var(--space-2xl) 0;
  padding: var(--space-2xl);
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.segment {
  display: flex !important;
  gap: 10px !important;
  flex-wrap: wrap !important;
  margin-bottom: 14px !important;
}

.chip {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-pill);
  padding: var(--space-sm) var(--space-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-small);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  margin: 0;
  box-shadow: var(--shadow-xs);
}

.chip:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.chip.is-active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.chip:active {
  transform: translateY(0) scale(0.98);
}

.chip:focus-visible {
  outline: 2px solid #274C9C;
  outline-offset: 2px;
}

.textbox {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  min-height: 180px;
  font-size: var(--font-body);
  width: 100%;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  transition: all var(--transition-fast);
  color: var(--text-primary);
  box-shadow: var(--shadow-xs);
}

.textbox:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 
    0 0 0 4px rgba(0, 122, 255, 0.1),
    var(--shadow-sm);
}

.textbox::placeholder {
  color: var(--text-tertiary);
}

.save-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  color: var(--text-sub);
  font-size: 0.875rem;
}

.btn-save {
  height: 44px;
  min-width: 140px;
  padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  border: none;
  font-size: var(--font-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.btn-save:hover {
  background: #0051D5;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-save:active {
  background: #1D4ED8;
  transform: translateY(-1px) scale(0.98);
}

.btn-save:focus-visible {
  outline: 2px solid #2F6FEB;
  outline-offset: 2px;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ===== 点亮你的旅程 ===== */
.ignite {
  background: linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-3xl);
  text-align: center;
  max-width: 1024px;
  margin: var(--space-3xl) auto;
}

.ignite h3 {
  font-size: var(--font-heading);
  margin: 0 0 var(--space-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.ignite .nums {
  display: flex;
  gap: 40px;
  justify-content: center;
  margin: 16px 0 8px;
}

.ignite .nums .n {
  font-size: 44px;
  font-weight: 800;
  color: #FF5A4F;
  line-height: 1;
}

.ignite .nums .n + div {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.btn-ignite {
  height: 48px;
  min-width: 140px;
  padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: #fff;
  border: none;
  font-size: var(--font-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-right: var(--space-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.btn-ignite:hover {
  background: #E63939;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-ignite:active {
  background: #E63939;
  transform: translateY(-1px) scale(0.98);
}

.btn-ignite:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-lite {
  height: 48px;
  min-width: 140px;
  padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: var(--font-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-shadow: var(--shadow-xs);
}

.btn-lite:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-lite:active {
  background: #F1F5F9;
  transform: translateY(-1px) scale(0.98);
}

.btn-lite:focus-visible {
  outline: 2px solid #1F2A44;
  outline-offset: 2px;
}

/* 响应式 */
@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }
  .action-item {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    min-height: auto;
    max-height: none;
  }
  .action-item .icon {
    width: auto;
  }
  .pill {
    width: 100%;
    margin-top: 8px;
  }
  .ignite .nums {
    gap: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-head h3::after {
    display: none;
  }
  .action-item:hover,
  .card:hover,
  .pill:hover,
  .btn-ignite:hover,
  .btn-lite:hover,
  .btn-outline:hover,
  .btn-save:hover,
  .chip:hover {
    transform: none;
  }
  .action-item:active,
  .card:active,
  .pill:active,
  .btn-ignite:active,
  .btn-lite:active,
  .btn-outline:active,
  .btn-save:active,
  .chip:active {
    transform: scale(1);
  }
}

/* 可达性：确保对比度 */
@media (prefers-contrast: high) {
  .action-item {
    border-width: 2px;
  }
  .pill {
    border-width: 2px;
  }
}

/* 动态字体支持 */
@supports (font-size: clamp(1rem, 1vw, 2rem)) {
  .action-item .title {
    font-size: clamp(18px, 2.5vw, 22px);
  }
  .action-item .desc {
    font-size: clamp(14px, 2vw, 16px);
  }
}

.debug-info {
  padding: 20px;
  background: #fff3cd;
  margin: 20px;
  border-radius: 8px;
}

.hidden-file-input {
  display: none;
}

/* ===== 镜湖映心：优化后的映照阶段样式 ===== */
.reflection-stage-optimized {
  position: relative;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero区域 */
.reflection-hero-section {
  position: relative;
  min-height: 50vh;
  padding: 4rem 0;
  background: linear-gradient(135deg, rgba(230, 250, 245, 0.4), rgba(220, 245, 255, 0.4));
  border-radius: 24px;
  margin-bottom: 3rem;
  overflow: hidden;
}

.reflection-hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(200, 230, 255, 0.1), transparent 70%);
  pointer-events: none;
}

.reflection-hero-container {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 2rem;
  align-items: start;
}

.reflection-hero-left {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reflection-hero-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 500;
  color: #111;
  margin: 0;
  line-height: 1.3;
}

.reflection-hero-subtitle {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  color: #333;
  margin: 0;
  font-weight: 400;
}

.reflection-hero-description {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: #666;
  margin: 0;
  line-height: 1.6;
  font-style: italic;
}

.reflection-hero-right {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reflection-hero-cta {
  min-width: 200px;
  border-radius: 12px;
  height: 44px;
  font-size: 0.95rem;
  font-weight: 500;
}

.reflection-hero-cta.primary {
  background: rgba(254, 50, 50, 0.85);
  border: none;
  color: #fff;
}

.reflection-hero-cta.primary:hover {
  background: rgba(254, 50, 50, 1);
  transform: translateY(-2px);
}

.reflection-hero-cta.secondary {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(136, 176, 227, 0.3);
  color: #333;
}

.reflection-breadcrumb {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(136, 176, 227, 0.2);
}

.reflection-breadcrumb-item {
  padding: 0.5rem 1.25rem;
  color: #666;
  text-decoration: none;
  border-radius: 999px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.reflection-breadcrumb-item:hover {
  color: #333;
  background: rgba(136, 176, 227, 0.1);
}

.reflection-breadcrumb-item.active {
  color: #111;
  background: rgba(136, 176, 227, 0.2);
  font-weight: 500;
}

.reflection-sound-control {
  position: absolute;
  top: 2rem;
  right: 2rem;
}

.sound-toggle {
  color: #666;
}

/* 三卡操作区 */
.reflection-action-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.mirror-action-card {
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  padding: 3.5rem 2rem 2rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

.mirror-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
}

.mirror-action-card.completed {
  background: rgba(230, 250, 240, 0.7);
  border-color: rgba(56, 239, 125, 0.3);
}

.action-card-header {
  position: relative;
  margin-bottom: 1.5rem;
}

.action-card-title-wrapper {
  position: relative;
}

.action-card-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.action-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111;
  margin: 0;
  line-height: 1.4;
}

.action-card-white-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  pointer-events: none;
}

.action-card-instruction {
  font-size: 0.95rem;
  color: #333;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.action-card-benefit {
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.action-card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.75rem;
  color: #666;
}

.action-card-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.action-card-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(136, 176, 227, 0.4);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-card-btn:hover {
  background: rgba(136, 176, 227, 0.15);
  border-color: rgba(136, 176, 227, 0.6);
  transform: scale(1.02);
}

.action-card-btn.btn-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(254, 50, 50, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

/* .action-check-mark 已整合到 .check-mark */

/* 感受记录区 */
.reflection-records-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 2rem;
  margin-bottom: 3rem;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.records-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #111;
  margin: 0;
}

.records-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  height: 36px;
  min-width: 80px;
  padding: 0 1rem;
  border-radius: 8px;
  border: 1px solid rgba(136, 176, 227, 0.3);
  background: rgba(255, 255, 255, 0.8);
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur) var(--ease);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(136, 176, 227, 0.1);
  border-color: rgba(136, 176, 227, 0.4);
  transform: translateY(-1px);
}

.filter-btn.active {
  background: rgba(136, 176, 227, 0.2);
  border-color: rgba(136, 176, 227, 0.5);
  color: #111;
  font-weight: 600;
}

.filter-btn:active {
  transform: translateY(0) scale(0.98);
}

.filter-btn:focus-visible {
  outline: 2px solid rgba(136, 176, 227, 0.5);
  outline-offset: 2px;
}

.export-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  color: #666;
  font-size: 0.875rem;
  transition: all var(--dur) var(--ease);
}

.export-btn:hover {
  background: rgba(136, 176, 227, 0.1);
  color: #111;
}

.export-btn:focus-visible {
  outline: 2px solid rgba(136, 176, 227, 0.5);
  outline-offset: 2px;
}

.records-today,
.records-history {
  margin-bottom: 2rem;
}

.today-label,
.history-label {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin: 0 0 1rem 0;
}

.records-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 3px solid rgba(136, 176, 227, 0.4);
}

.record-time,
.record-date {
  font-size: 0.75rem;
  color: #666;
  min-width: 50px;
}

.record-content {
  flex: 1;
}

.record-text {
  color: #333;
  line-height: 1.6;
}

.record-audio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
}

.record-image img {
  max-width: 200px;
  border-radius: 8px;
}

.records-empty {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 0.95rem;
  line-height: 1.6;
}

/* 完成计数器 */
.today-completed-counter {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 0.75rem 1.5rem;
  background: rgba(254, 50, 50, 0.9);
  color: white;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(254, 50, 50, 0.3);
  z-index: 1000;
  animation: counterPop 0.5s ease;
}

@keyframes counterPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.counter-pop-enter-active { transition: all 0.3s ease; }
.counter-pop-enter-from { transform: scale(0); opacity: 0; }

@media (max-width: 900px) {
  .reflection-hero-container {
    grid-template-columns: 1fr;
  }
  .reflection-hero-right {
    align-items: stretch;
  }
  .reflection-action-cards {
    grid-template-columns: 1fr;
  }
  .records-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ② 映照阶段：五层心理镜面体验样式（保留旧版本） */
.reflection-stage {
  position: relative;
  min-height: 80vh;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.98) 0%,
    rgba(245, 247, 250, 0.95) 50%,
    rgba(242, 245, 248, 0.98) 100%
  );
}

/* ① 意象召唤层：背景效果 */
.reflection-background-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.background-mist {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.4) 0%, transparent 60%),
    radial-gradient(circle at 70% 50%, rgba(200, 230, 255, 0.3) 0%, transparent 60%);
  animation: mistFlow 20s ease-in-out infinite;
}

.background-water {
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(180deg, transparent 0%, rgba(200, 220, 255, 0.1) 50%, transparent 100%);
  opacity: 0.6;
  animation: waterRipple 15s ease-in-out infinite;
}

.background-light {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  animation: lightPulse 8s ease-in-out infinite;
}

@keyframes mistFlow {
  0%, 100% {
    transform: translateX(0) translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateX(20px) translateY(-15px);
    opacity: 0.8;
  }
}

@keyframes waterRipple {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.6;
  }
  50% {
    transform: scaleY(1.05);
    opacity: 0.8;
  }
}

@keyframes lightPulse {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.25;
    transform: scale(1.1);
  }
}

/* 标题层 */
.fade-in-enter-active {
  transition: all 1.2s ease-out;
}

.fade-in-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.reflection-title-layer {
  text-align: center;
  position: relative;
  z-index: 1;
  margin-bottom: clamp(2rem, 4vw, 3rem);
}

.reflection-main-title {
  font-size: clamp(3rem, 7vw, 5rem);
  font-weight: 300;
  color: #2d3a34;
  margin: 0 0 1rem;
  letter-spacing: 0.15em;
  opacity: 0.9;
}

.reflection-main-subtitle {
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  font-weight: 300;
  color: #66707a;
  margin: 0;
  font-style: italic;
  letter-spacing: 0.1em;
}

/* ② 自我映照层：镜子卡片 */
.fade-in-delayed-enter-active {
  transition: all 1s ease-out 0.5s;
}

.fade-in-delayed-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.reflection-mirror-layer {
  width: 100%;
  max-width: 1000px;
  position: relative;
  z-index: 1;
}

.mirror-hint {
  text-align: center;
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #66707a;
  font-weight: 300;
  margin: 0 0 3rem;
  font-style: italic;
  letter-spacing: 0.05em;
}

.reflection-mirror-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  width: 100%;
}

@media (max-width: 768px) {
  .reflection-mirror-cards {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.mirror-card {
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
  opacity: 0;
  transform: scale(0.95) translateY(20px);
  animation: mirrorCardAppear 0.8s ease-out forwards;
  animation-delay: calc(var(--card-delay, 0s) + 0.8s);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04);
}

@keyframes mirrorCardAppear {
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.mirror-card:hover {
  transform: scale(1.02) translateY(-8px);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.08);
}

.mirror-card-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.8s ease;
}

.mirror-card:hover .mirror-card-background {
  transform: scale(1.1);
}

.scene-tundra {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #ddeeff 100%);
}

.scene-volcano {
  background: linear-gradient(135deg, #2d1b1b 0%, #4a2c2c 50%, #3d2222 100%);
}

.scene-aurora {
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f141f 100%);
}

.scene-effect {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.scene-tundra .scene-effect {
  background: 
    radial-gradient(circle at 50% 60%, rgba(255, 255, 255, 0.4) 0%, transparent 70%),
    linear-gradient(180deg, transparent 0%, rgba(200, 230, 255, 0.2) 100%);
}

.scene-volcano .scene-effect {
  background: 
    radial-gradient(circle at 50% 50%, rgba(255, 69, 0, 0.3) 0%, transparent 70%);
  animation: volcanoGlow 3s ease-in-out infinite;
}

.scene-aurora .scene-effect {
  background: 
    linear-gradient(90deg, 
      rgba(0, 255, 150, 0.2) 0%,
      rgba(100, 200, 255, 0.3) 25%,
      rgba(150, 100, 255, 0.2) 50%,
      rgba(255, 100, 150, 0.3) 75%,
      rgba(0, 255, 150, 0.2) 100%
    );
  animation: auroraShift 8s ease-in-out infinite;
}

@keyframes volcanoGlow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

@keyframes auroraShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.mirror-card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.mirror-card-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.mirror-card-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
}

.mirror-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ===== 旧样式已整合到上方统一样式 (.stage-card, .action-item, .pill) ===== */

.check-mark {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #38ef7d, #11998e);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(56, 239, 125, 0.4);
  animation: checkGlow 0.6s ease;
}

@keyframes checkGlow {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.check-glow-enter-active { transition: all 0.3s ease; }
.check-glow-enter-from { transform: scale(0); opacity: 0; }

/* ===== 内化阶段样式已整合到上方.segment, .chip, .textbox, .save-row ===== */

/* ===== 点亮你的旅程（已整合到上方.ignite样式） ===== */

@media (max-width: 768px) {
  .stage-card {
    padding: var(--space-5);
    margin: 1rem auto;
  }
}

/* ③ 内心回声层：场景沉浸体验 */
.scene-transition-enter-active {
  transition: all 1s ease-out;
}
.scene-transition-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.reflection-scene-layer {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.tundra-scene,
.volcano-scene,
.aurora-scene {
  width: 100%;
  max-width: 800px;
  height: 80vh;
  max-height: 600px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tundra-scene {
  background: linear-gradient(180deg, #e8f4f8 0%, #f0f8ff 100%);
}

.volcano-scene {
  background: linear-gradient(180deg, #1a0f0f 0%, #2d1b1b 100%);
}

.aurora-scene {
  background: linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%);
}

.tundra-horizon {
  position: absolute;
  bottom: 30%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.footprint-trail {
  position: absolute;
  inset: 0;
}

.footprint {
  position: absolute;
  width: 30px;
  height: 15px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: footprintFade 4s ease-out forwards;
}

@keyframes footprintFade {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

.volcano-rock {
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 40%;
  background: radial-gradient(ellipse at 50% 0%, #3d2222 0%, #1a0f0f 100%);
  border-radius: 50% 50% 0 0;
}

.volcano-glow {
  position: absolute;
  bottom: 15%;
  left: 45%;
  width: 10%;
  height: 20%;
  background: radial-gradient(ellipse, rgba(255, 69, 0, 0.6) 0%, transparent 70%);
  animation: volcanoPulse 2s ease-in-out infinite;
}

@keyframes volcanoPulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1);
  }
}

.aurora-lights {
  position: absolute;
  inset: 0;
}

.aurora-light {
  position: absolute;
  width: 100%;
  height: 60px;
  border-radius: 30px;
  animation: auroraWave 4s ease-in-out infinite;
}

@keyframes auroraWave {
  0%, 100% {
    transform: translateX(-10px) scaleY(1);
    opacity: 0.6;
  }
  50% {
    transform: translateX(10px) scaleY(1.1);
    opacity: 0.9;
  }
}

.scene-question {
  position: relative;
  z-index: 5;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.question-text {
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  font-weight: 300;
  color: #fff;
  margin: 0;
  line-height: 1.8;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.stone-writing-area {
  position: absolute;
  bottom: 20%;
  left: 10%;
  right: 10%;
  z-index: 6;
}

.stone-textarea {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.aurora-response {
  position: absolute;
  bottom: 20%;
  left: 10%;
  right: 10%;
  text-align: center;
  padding: 2rem;
  background: rgba(0, 255, 150, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(0, 255, 150, 0.3);
}

.response-text {
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
  color: #fff;
  margin: 0;
  line-height: 1.8;
  font-style: italic;
}

.scene-exit {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 10;
}

.exit-scene-btn {
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

/* ④ 感受记录层 */
.fade-up-enter-active {
  transition: all 0.8s ease-out;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.reflection-record-layer {
  width: 100%;
  max-width: 700px;
  position: relative;
  z-index: 2;
  text-align: center;
}

.record-section-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 300;
  color: #2d3a34;
  margin: 0 0 2rem;
}

.record-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reflection-record-textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  padding: 1.5rem;
  font-size: 1rem;
  line-height: 1.7;
  background: rgba(255, 255, 255, 0.9);
}

.save-record-btn {
  align-self: center;
  padding: 0.75rem 2.5rem;
  border-radius: 24px;
}

.reflection-quote-card {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.quote-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.quote-text {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #2d3a34;
  line-height: 1.8;
  margin: 0;
  font-style: italic;
}

/* ⑤ 心理回收层：镜子合上动画 */
.mirror-close-enter-active {
  transition: all 1.5s ease-out;
}

.mirror-close-enter-from {
  opacity: 0;
}

.reflection-close-layer {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.mirror-close-animation {
  position: relative;
  width: 400px;
  height: 500px;
  margin-bottom: 3rem;
}

.mirror-left,
.mirror-right {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, rgba(200, 220, 255, 0.3), rgba(255, 255, 255, 0.6));
  border-radius: 20px 0 0 20px;
  animation: mirrorCloseLeft 2s ease-out forwards;
}

.mirror-right {
  right: 0;
  border-radius: 0 20px 20px 0;
  animation: mirrorCloseRight 2s ease-out forwards;
}

@keyframes mirrorCloseLeft {
  from {
    transform: translateX(0) rotateY(0deg);
  }
  to {
    transform: translateX(-100%) rotateY(-90deg);
  }
}

@keyframes mirrorCloseRight {
  from {
    transform: translateX(0) rotateY(0deg);
  }
  to {
    transform: translateX(100%) rotateY(90deg);
  }
}

.close-message {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 300;
  color: #2d3a34;
  margin: 0 0 1rem;
  letter-spacing: 0.1em;
}

.close-submessage {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #66707a;
  margin: 0;
  font-style: italic;
}

.reflection-continue {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: 2rem;
}

/* 保留旧样式以兼容（如果还有其他地方使用） */
.reflection-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  width: 100%;
  max-width: 1000px;
  position: relative;
  z-index: 1;
  padding: 0.5rem 0 2rem;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .reflection-cards-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* 心境共鸣卡片 */
.reflection-card {
  position: relative;
  padding: clamp(1.5rem, 3vw, 2rem);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: clamp(16px, 4vw, 20px);
  border: 1.5px solid rgba(56, 239, 125, 0.18);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
  touch-action: manipulation;
  transition: all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
  opacity: 0;
  transform: translateY(30px) scale(0.97);
  animation: cardAppear 0.8s ease-out forwards;
  animation-delay: calc(var(--card-delay, 0s) + 0.3s);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 2px 10px rgba(56, 239, 125, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.reflection-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(56, 239, 125, 0.35);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(56, 239, 125, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.reflection-card:active {
  transform: translateY(-6px) scale(1.01);
  transition: all 0.2s ease;
}

.reflection-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(56, 239, 125, 0.05) 0%,
    rgba(17, 153, 142, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.reflection-card.focused::before,
.reflection-card.selected::before {
  opacity: 1;
}

.card-glow {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(56, 239, 125, 0.2),
    rgba(17, 153, 142, 0.2)
  );
  opacity: 0;
  filter: blur(12px);
  transition: opacity 0.4s ease;
  z-index: -1;
}

.reflection-card.focused .card-glow,
.reflection-card.selected .card-glow {
  opacity: 0.6;
}

.reflection-card.focused {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(56, 239, 125, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(56, 239, 125, 0.15);
}

.reflection-card.selected {
  transform: translateY(-12px) scale(1.03);
  border-color: rgba(56, 239, 125, 0.5);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(56, 239, 125, 0.2);
  background: rgba(255, 255, 255, 0.95);
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 2vw, 1.25rem);
  pointer-events: auto;
  width: 100%;
  height: 100%;
  justify-content: space-between;
}

.card-emotion-icon {
  font-size: clamp(2rem, 4vw, 2.5rem);
  text-align: center;
  opacity: 0.9;
  line-height: 1;
  animation: gentlePulse 4s ease-in-out infinite;
  filter: drop-shadow(0 2px 8px rgba(56, 239, 125, 0.15));
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.reflection-card:hover .card-emotion-icon {
  transform: scale(1.08);
}

.card-text {
  font-size: clamp(1rem, 2.2vw, 1.25rem);
  font-weight: 400;
  color: #2d3a34;
  line-height: 1.6;
  text-align: center;
  letter-spacing: 0.01em;
  margin: 0;
  padding: 0 0.25rem;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reflection-card.selected .card-text {
  color: #1a7f3a;
  font-weight: 500;
}

.card-intensity {
  height: 4px;
  background: rgba(56, 239, 125, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  margin-top: 0.5rem;
  width: 100%;
  max-width: 150px;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.intensity-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(56, 239, 125, 0.6),
    rgba(17, 153, 142, 0.8)
  );
  border-radius: 2px;
  transition: width 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
  animation: intensityGrow 1.2s ease-out forwards;
  animation-delay: calc(var(--card-delay, 0s) + 0.8s);
}

.reflection-card.selected .intensity-bar {
  background: linear-gradient(
    90deg,
    rgba(56, 239, 125, 0.9),
    rgba(17, 153, 142, 1)
  );
}

@keyframes cardAppear {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes gentlePulse {
  0%, 100% {
    opacity: 0.9;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes intensityGrow {
  from {
    width: 0;
  }
}

.reflection-emotional-extension {
  margin-top: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  text-align: center;
  animation: fadeIn 1s ease-out 1s both;
}

.emotional-text {
  font-size: clamp(1rem, 2.2vw, 1.3rem);
  font-weight: 300;
  color: #66707a;
  line-height: 1.8;
  letter-spacing: 0.02em;
  margin: 0;
  font-style: italic;
}

.reflection-hint {
  margin-top: clamp(2rem, 4vw, 3rem);
  text-align: center;
  color: #66707a;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-weight: 300;
  letter-spacing: 0.05em;
  animation: fadeIn 1s ease-out 1.5s both;
}

.reflection-transition {
  margin-top: clamp(2rem, 4vw, 3rem);
  text-align: center;
  animation: slideUp 0.6s ease-out;
}

.transition-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  border: none !important;
  border-radius: 28px !important;
  height: 56px !important;
  padding: 0 2.5rem !important;
  font-size: 1.1rem !important;
  font-weight: 500 !important;
  box-shadow: 0 8px 24px rgba(17, 153, 142, 0.25) !important;
  transition: all 0.3s ease !important;
}

.transition-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 32px rgba(17, 153, 142, 0.35) !important;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.reflection-stage.reflection-completed {
  padding-bottom: clamp(4rem, 8vw, 6rem);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ③ 破晓阶段：五层沉浸式体验样式 */
.awakening-stage {
  position: relative;
  min-height: 100vh;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem);
  background: linear-gradient(
    180deg,
    rgba(240, 245, 250, 0.95) 0%,
    rgba(255, 255, 255, 0.98) 50%,
    rgba(248, 252, 250, 0.95) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(2rem, 4vw, 3rem);
}

/* ① 视觉引导层 */
.awakening-visual-guide {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.visual-icon {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 1s ease-out;
}

.visual-icon.active {
  opacity: 1;
  transform: scale(1);
  animation: visualAppear 1.5s ease-out;
}

@keyframes visualAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.icon-glow {
  font-size: 4rem;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 20px rgba(56, 239, 125, 0.5));
  animation: gentlePulse 3s ease-in-out infinite;
}

.breathing-circle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(56, 239, 125, 0.3);
  animation: breathingCircle 6s ease-in-out infinite;
}

@keyframes breathingCircle {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

.awakening-main-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300;
  color: #2d3a34;
  letter-spacing: 0.1em;
  margin: 0;
  animation: titleFadeIn 1s ease-out forwards;
}
@keyframes titleFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.title-part-1,
.title-part-2 {
  display: inline-block;
}

.title-separator {
  margin: 0 0.5rem;
  color: rgba(56, 239, 125, 0.6);
}

/* ② 心理触发层 */
.fade-guide-enter-active {
  transition: all 0.8s ease-out;
}
.fade-guide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.awakening-trigger-layer {
  text-align: center;
  padding: 2rem;
  cursor: pointer;
  user-select: none;
  max-width: 600px;
  transition: all 0.3s ease;
}

.awakening-trigger-layer:active {
  transform: scale(0.98);
}

.trigger-guide-text {
  font-size: clamp(1.2rem, 3vw, 1.6rem);
  font-weight: 300;
  color: #2d3a34;
  line-height: 1.8;
  margin: 0;
  font-style: italic;
  letter-spacing: 0.05em;
}

/* ③ 体验行动层 */
.fade-actions-enter-active {
  transition: all 0.8s ease-out;
}

.fade-actions-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.awakening-actions-layer {
  width: 100%;
  max-width: 900px;
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.experience-action-card {
  width: 100%;
  max-width: 600px;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  opacity: 0;
  transform: translateX(-30px);
  animation: actionCardAppear 0.6s ease-out forwards;
  animation-delay: calc(var(--action-delay, 0s) + 0.2s);
}

@keyframes actionCardAppear {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.experience-action-card:hover {
  transform: translateX(8px);
  border-color: rgba(56, 239, 125, 0.4);
  box-shadow: 0 8px 32px rgba(56, 239, 125, 0.15);
}

.action-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.action-text {
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: #2d3a34;
  margin: 0;
  flex: 1;
  text-align: left;
  line-height: 1.6;
}

/* ④ 记录与反思层 */
.fade-record-enter-active {
  transition: all 0.8s ease-out;
}

.fade-record-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.awakening-record-layer {
  width: 100%;
  max-width: 700px;
  text-align: center;
}

.record-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 300;
  color: #2d3a34;
  margin: 0 0 2rem;
}

.record-input-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.record-textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  padding: 1.5rem;
  font-size: 1rem;
  line-height: 1.7;
}

.save-reflection-btn {
  align-self: center;
  padding: 0.75rem 2.5rem;
  border-radius: 24px;
}

/* ⑤ 延伸引导层 */
.fade-continue-enter-active {
  transition: all 1s ease-out;
}

.fade-continue-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.awakening-continue-layer {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.continue-guide-text {
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
  font-weight: 300;
  color: #66707a;
  line-height: 1.8;
  margin: 0;
  font-style: italic;
}

.continue-btn {
  padding: 0.75rem 2.5rem;
  border-radius: 24px;
}

/* 体验模式模态框 */
.experience-modal-content {
  min-height: 400px;
}

.experience-meditation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.meditation-visual {
  width: 100%;
  height: 200px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.1), rgba(56, 239, 125, 0.1));
  position: relative;
  overflow: hidden;
}

.steam-effect {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: steamRise 8s ease-in-out infinite;
}

@keyframes steamRise {
  0%, 100% {
    transform: translateY(50px) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) scale(1.1);
    opacity: 0.6;
  }
}

.breathing-guide {
  text-align: center;
  width: 100%;
}

.breathing-instruction {
  font-size: 1.2rem;
  color: #66707a;
  margin-bottom: 1.5rem;
}

.breathing-indicator {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.breath-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid rgba(56, 239, 125, 0.4);
  transition: all 4s ease-in-out;
}

.breath-circle.inhale {
  transform: scale(1.3);
  border-color: rgba(56, 239, 125, 0.6);
}

.breath-circle.exhale {
  transform: scale(0.8);
  border-color: rgba(17, 153, 142, 0.4);
}

.breathing-text {
  font-size: 1.5rem;
  color: #2d3a34;
  font-weight: 300;
  margin-top: 1rem;
}

.experience-shaman {
  text-align: center;
}

.shaman-audio {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.audio-wave {
  width: 200px;
  height: 80px;
  background: linear-gradient(90deg, 
    rgba(56, 239, 125, 0.2) 0%,
    rgba(17, 153, 142, 0.4) 25%,
    rgba(56, 239, 125, 0.6) 50%,
    rgba(17, 153, 142, 0.4) 75%,
    rgba(56, 239, 125, 0.2) 100%
  );
  border-radius: 40px;
  animation: audioWave 2s ease-in-out infinite;
}

@keyframes audioWave {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}

.shaman-question {
  font-size: 1.3rem;
  color: #2d3a34;
  font-weight: 400;
  margin: 0;
}

.shaman-textarea {
  width: 100%;
  border-radius: 12px;
}

.experience-vow {
  text-align: center;
}

/* ========== 触摸交互模式样式 ========== */
.experience-touch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.touch-guide {
  width: 100%;
  text-align: center;
}

.touch-instruction {
  font-size: 1.2rem;
  color: #66707a;
  margin-bottom: 2rem;
}

.touch-canvas {
  width: 100%;
  height: 300px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  touch-action: none;
}

.touch-ripple {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 193, 7, 0.6) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  animation: rippleExpand 1s ease-out forwards;
  pointer-events: none;
}

@keyframes rippleExpand {
  to {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

.touch-warmth-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 193, 7, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 24px;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.warmth-text {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 500;
}

/* ========== 视觉追踪模式样式 ========== */
.experience-gaze {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.gaze-guide {
  width: 100%;
  text-align: center;
}

.gaze-instruction {
  font-size: 1.2rem;
  color: #66707a;
  margin-bottom: 2rem;
}

.gaze-tracking-area {
  width: 100%;
  height: 300px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(99, 102, 241, 0.1));
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.gaze-center-point {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(147, 51, 234, 0.8);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
}

.gaze-light-beam {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 150px;
  background: linear-gradient(to bottom, rgba(147, 51, 234, 0.9), transparent);
  transform-origin: bottom center;
  transition: transform 0.1s ease-out, opacity 0.2s ease;
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
}

.gaze-focus-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border: 2px solid rgba(147, 51, 234, 0.5);
  border-radius: 50%;
  transition: scale 0.2s ease;
}

.gaze-feedback {
  font-size: 1rem;
  color: rgba(147, 51, 234, 0.8);
  margin-top: 1rem;
  font-style: italic;
}

/* ========== 声音交互模式样式 ========== */
.experience-sound {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.sound-guide {
  width: 100%;
  text-align: center;
}

.sound-instruction {
  font-size: 1.2rem;
  color: #66707a;
  margin-bottom: 2rem;
}

.sound-visualizer {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.sound-bar {
  width: 8px;
  min-height: 10px;
  background: linear-gradient(to top, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8));
  border-radius: 4px 4px 0 0;
  transition: height 0.1s ease;
  animation: soundPulse 0.3s ease;
}

@keyframes soundPulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.1); }
}

.sound-record-btn {
  padding: 0.75rem 2rem;
  border-radius: 24px;
  border: 2px solid rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
  color: rgba(59, 130, 246, 0.9);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-record-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.8);
}

.sound-record-btn.recording {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.8);
  color: rgba(239, 68, 68, 0.9);
  animation: recordingPulse 1s ease-in-out infinite;
}

@keyframes recordingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.sound-feedback {
  font-size: 1rem;
  color: rgba(59, 130, 246, 0.8);
  margin-top: 1rem;
  font-style: italic;
}

/* ========== 文字粒子模式样式 ========== */
.experience-text-particle {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.text-particle-guide {
  width: 100%;
}

.particle-instruction {
  font-size: 1.2rem;
  color: #66707a;
  margin-bottom: 1.5rem;
  text-align: center;
}

.particle-textarea {
  width: 100%;
  margin-bottom: 2rem;
}

.particle-canvas {
  width: 100%;
  height: 300px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.1));
  position: relative;
  overflow: hidden;
}

.text-particle {
  position: absolute;
  color: rgba(236, 72, 153, 0.9);
  font-weight: 500;
  pointer-events: none;
  user-select: none;
}

@keyframes particleFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

.vow-input-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.vow-prompt {
  font-size: 1.2rem;
  color: #66707a;
  margin: 0;
}

.vow-textarea {
  width: 100%;
  border-radius: 12px;
  min-height: 150px;
}

.release-vow-btn {
  align-self: center;
  padding: 0.75rem 2.5rem;
  border-radius: 24px;
}

.vow-particles-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.text-particle {
  position: absolute;
  font-size: 1.5rem;
  color: rgba(56, 239, 125, 0.9);
  animation: particleFloat 2s ease-out forwards;
  pointer-events: none;
}

@keyframes particleFloat {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx, 0), var(--ty, -200px)) scale(0.3) rotate(var(--rot, 360deg));
  }
}

.experience-modal-actions {
  margin-top: 2rem;
  text-align: center;
}

/* ③ 对话阶段：四大支柱模块样式 */
.dialogue-stage {
  position: relative;
  min-height: 100vh;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(247, 251, 249, 0.95) 50%,
    rgba(242, 250, 242, 0.98) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dialogue-header {
  text-align: center;
  margin-bottom: clamp(3rem,5rem);
  animation: fadeInDown 0.8s ease-out;
}

.dialogue-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 400;
  color: #2d3a34;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.dialogue-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #66707a;
  font-weight: 300;
  letter-spacing: 0.05em;
}

/* 认知触发问题卡片容器 */
.cognitive-triggers-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .cognitive-triggers-container {
    grid-template-columns: 1fr;
  }
}

/* 认知卡片 */
.cognitive-card {
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  animation: cardAppear 0.6s ease-out forwards;
  animation-delay: calc(var(--card-delay, 0s) + 0.2s);
}

@keyframes cardAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 认知卡片主体 */
.cognitive-card-main {
  position: relative;
  padding: clamp(1.5rem, 3vw, 2rem);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(56, 239, 125, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cognitive-card-main:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 239, 125, 0.4);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(56, 239, 125, 0.15);
}

.cognitive-card-main.has-reflection {
  border-color: rgba(56, 239, 125, 0.4);
  background: rgba(255, 255, 255, 1);
}

/* 完成标记 */
.card-completed-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
}

/* 认知图标 */
.cognitive-icon {
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: 1rem;
  animation: gentlePulse 3s ease-in-out infinite;
}

/* 认知问题文本 */
.cognitive-question {
  font-size: clamp(1rem, 2vw, 1.125rem);
  font-weight: 400;
  color: #2d3a34;
  line-height: 1.7;
  margin: 0 0 1.25rem;
  min-height: 3em;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 卡片展开内容 */
.cognitive-card-expanded {
  margin-top: 1rem;
  padding: 1.25rem;
  background: rgba(56, 239, 125, 0.05);
  border-radius: 12px;
  border-left: 3px solid rgba(56, 239, 125, 0.4);
}

.expanded-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
/* 认知仪式与象征 */
.cognitive-ritual {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
}
/* 认知契机时刻 */
.cognitive-moment {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
}
/* 卡片展开动画 */
.card-expand-enter-active,
.card-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.card-expand-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.card-expand-enter-to {
  opacity: 1;
  transform: translateY(0);
  max-height: 300px;
}

.card-expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 300px;
}

.card-expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.four-pillars-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  width: 100%;
  max-width: 1000px;
  position: relative;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .four-pillars-container {
    grid-template-columns: 1fr;
  }
}

.pillar-module {
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  animation: pillarAppear 0.8s ease-out forwards;
  animation-delay: calc(var(--pillar-delay, 0s) + 0.3s);
}

.pillar-card {
  position: relative;
  padding: clamp(2rem, 4vw, 2.5rem);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: clamp(20px, 4vw, 24px);
  border: 1px solid rgba(56, 239, 125, 0.2);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
  touch-action: manipulation;
  transition: all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(56, 239, 125, 0.08);
}

.pillar-card:active {
  transform: translateY(-2px);
}

.pillar-card.has-reflection {
  border-color: rgba(56, 239, 125, 0.4);
  background: rgba(255, 255, 255, 0.95);
}

/* 已完成标记 */
.pillar-completed-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
  }
}

.pillar-card:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 239, 125, 0.4);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(56, 239, 125, 0.15);
}

.pillar-module.pillar-expanded .pillar-card {
  border-color: rgba(56, 239, 125, 0.5);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(56, 239, 125, 0.2);
}

.pillar-icon {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  text-align: center;
  margin-bottom: 1rem;
  animation: gentlePulse 3s ease-in-out infinite;
}

.pillar-title {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 600;
  color: #2d3a34;
  text-align: center;
  margin: 0 0 1rem;
}

.pillar-question {
  font-size: clamp(1rem, 2vw, 1.125rem);
  font-weight: 400;
  color: #66707a;
  line-height: 1.6;
  text-align: center;
  margin: 0 0 1.5rem;
  font-style: italic;
}

.think-question-btn {
  width: 100%;
  margin-top: 0.5rem;
  color: rgba(17, 153, 142, 0.8);
  border: 1px solid rgba(56, 239, 125, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.think-question-btn:hover {
  color: rgba(17, 153, 142, 1);
  border-color: rgba(56, 239, 125, 0.5);
  background: rgba(56, 239, 125, 0.05);
}

.think-question-btn.has-answer {
  color: rgba(17, 153, 142, 1);
  border-color: rgba(56, 239, 125, 0.4);
  background: rgba(56, 239, 125, 0.08);
}

.pillar-reflection {
  margin-top: 1rem;
  padding: clamp(1.5rem, 3vw, 2rem);
  background: rgba(56, 239, 125, 0.05);
  border-radius: 16px;
  border-left: 3px solid rgba(56, 239, 125, 0.4);
}

.reflection-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reflection-media {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.reflection-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.reflection-text {
  font-size: clamp(0.95rem, 1.8vw, 1.1rem);
  line-height: 1.8;
  color: #2d3a34;
  margin: 0;
  font-style: italic;
}

/* 仪式与象征（行为） */
.pillar-ritual {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 3px solid rgba(255, 193, 7, 0.5);
}

.ritual-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.ritual-content {
  flex: 1;
}

.ritual-label {
  font-size: clamp(0.85rem, 1.5vw, 0.95rem);
  font-weight: 600;
  color: rgba(255, 193, 7, 0.8);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ritual-text {
  font-size: clamp(0.9rem, 1.6vw, 1rem);
  line-height: 1.7;
  color: #2d3a34;
}

/* 契机时刻 */
.pillar-moment {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 3px solid rgba(147, 51, 234, 0.5);
}

.moment-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.moment-content {
  flex: 1;
}

.moment-label {
  font-size: clamp(0.85rem, 1.5vw, 0.95rem);
  font-weight: 600;
  color: rgba(147, 51, 234, 0.8);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.moment-text {
  font-size: clamp(0.9rem, 1.6vw, 1rem);
  line-height: 1.7;
  color: #2d3a34;
  font-style: italic;
}

.pillar-expand-enter-active,
.pillar-expand-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.pillar-expand-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.pillar-expand-enter-to {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}

.pillar-expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}

.pillar-expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.dialogue-conclusion {
  margin-top: clamp(2rem, 4vw, 3rem);
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
  text-align: center;
  animation: fadeIn 1s ease-out 0.5s both;
}

.conclusion-text {
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  font-weight: 300;
  color: #2d3a34;
  line-height: 1.8;
  letter-spacing: 0.02em;
  margin: 0;
  font-style: italic;
}

.dialogue-transition {
  margin-top: clamp(1.5rem, 3vw, 2rem);
  text-align: center;
  animation: slideUp 0.6s ease-out;
}

@keyframes pillarAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 反思模态框样式 */
.reflection-modal-content {
  padding: 1rem 0;
  text-align: center;
}

.reflection-modal-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: gentlePulse 3s ease-in-out infinite;
}

.reflection-modal-question {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.reflection-modal-media {
  width: 100%;
  max-height: 300px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.reflection-modal-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reflection-modal-text {
  padding: 1.5rem;
  background: rgba(56, 239, 125, 0.05);
  border-radius: 12px;
  border-left: 3px solid rgba(56, 239, 125, 0.4);
  margin-bottom: 1rem;
}

.reflection-modal-text p {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  color: #2d3a34;
  margin: 0;
  font-style: italic;
}

.reflection-modal-hint {
  padding: 1rem;
  background: rgba(56, 239, 125, 0.08);
  border-radius: 8px;
}

.reflection-modal-hint p {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: #66707a;
  margin: 0;
  line-height: 1.6;
}

/* 用户回答输入区样式 */
.reflection-modal-input-section {
  margin: 2rem 0;
  text-align: left;
}

.input-label {
  font-size: clamp(0.95rem, 1.8vw, 1.1rem);
  font-weight: 500;
  color: #2d3a34;
  margin: 0 0 0.75rem;
  display: block;
}

.reflection-textarea {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  transition: all 0.3s ease;
  font-size: clamp(0.95rem, 1.8vw, 1.05rem);
  line-height: 1.6;
}

.reflection-textarea :deep(.ant-input) {
  border: none;
  border-radius: 12px;
}

.reflection-textarea:focus-within {
  border-color: rgba(56, 239, 125, 0.5);
  box-shadow: 0 0 0 2px rgba(56, 239, 125, 0.1);
}

/* 已保存的回答显示 */
.saved-reflection {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(56, 239, 125, 0.08);
  border-radius: 8px;
  border-left: 3px solid rgba(56, 239, 125, 0.4);
}

.saved-reflection-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.saved-icon {
  font-size: 1.2rem;
}

.saved-label {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  font-weight: 500;
  color: #2d3a34;
}

.saved-content {
  font-size: clamp(0.9rem, 1.6vw, 1.05rem);
  line-height: 1.7;
  color: #66707a;
  margin: 0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-style: italic;
}

/* 模态框操作按钮 */
.reflection-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.reflection-modal-actions .ant-btn {
  min-width: 100px;
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
}

.reflection-modal-actions .ant-btn-primary {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.2);
}

.reflection-modal-actions .ant-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(17, 153, 142, 0.3);
  transform: translateY(-1px);
}

.reflection-modal-actions .ant-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 🌠 觉醒的巅峰：光 × 声 × 字的三重融合 */
.awakening-peak-stage {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.6) 100%
  );
  transition: background 2s ease;
  pointer-events: auto;
}

.awakening-peak-stage.is-active {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

/* 背景光效 */
.awakening-light-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.light-center-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(56, 239, 125, 0.3) 30%,
    rgba(17, 153, 142, 0.2) 60%,
    transparent 100%
  );
  border-radius: 50%;
  opacity: 0;
  animation: lightPulse 3s ease-in-out infinite;
  filter: blur(40px);
}

.awakening-peak-stage.is-active .light-center-glow {
  opacity: 1;
  animation: lightExpand 2s ease-out forwards, lightPulse 3s ease-in-out 2s infinite;
}

@keyframes lightExpand {
  from {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
  to {
    width: 800px;
    height: 800px;
    opacity: 1;
  }
}

@keyframes lightPulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.8;
  }
}

/* 文字容器 */
.awakening-text-container {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

.awakening-text {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 300;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
  letter-spacing: 0.05em;
  margin-bottom: 3rem;
  text-shadow: 
    0 2px 20px rgba(255, 255, 255, 0.3),
    0 0 40px rgba(56, 239, 125, 0.2);
  animation: textGlow 4s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% {
    opacity: 0.9;
    text-shadow: 
      0 2px 20px rgba(255, 255, 255, 0.3),
      0 0 40px rgba(56, 239, 125, 0.2);
  }
  50% {
    opacity: 1;
    text-shadow: 
      0 2px 30px rgba(255, 255, 255, 0.5),
      0 0 60px rgba(56, 239, 125, 0.4);
  }
}

/* 入口按钮 */
.awakening-entrance {
  margin-top: 2rem;
}

.entrance-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.95) !important;
  font-size: clamp(1rem, 2vw, 1.25rem) !important;
  font-weight: 300 !important;
  border-radius: 50px !important;
  transition: all 0.4s ease !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
}

.entrance-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(56, 239, 125, 0.5) !important;
  color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(56, 239, 125, 0.3) !important;
}

/* 过渡动画 */
.awakening-fade-enter-active {
  transition: opacity 2s ease, transform 2s ease;
}

.awakening-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.awakening-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.awakening-entrance-enter-active {
  transition: opacity 1.5s ease 0.5s, transform 1.5s ease 0.5s;
}

.awakening-entrance-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.awakening-entrance-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 隐藏声音控制元素 */
.awakening-sound-control {
  display: none;
}

/* ④ 内化阶段：写信给未来自己样式 */
.internalization-stage {
  position: relative;
  min-height: 100vh;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem);
  background: linear-gradient(
    180deg,
    rgba(247, 251, 249, 0.95) 0%,
    rgba(242, 250, 242, 0.98) 50%,
    rgba(240, 248, 245, 0.95) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.internalization-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 50% 50%, rgba(56, 239, 125, 0.05) 0%, transparent 70%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(56, 239, 125, 0.05) 100%);
  pointer-events: none;
  z-index: 0;
  animation: internalizationBreathe 8s ease-in-out infinite;
}

@keyframes internalizationBreathe {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.internalization-header {
  text-align: center;
  margin-bottom: clamp(3rem,4rem);
  position: relative;
  z-index: 1;
  animation: fadeInDown 0.8s ease-out;
}

.internalization-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 300;
  color: #2d3a34;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.internalization-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #66707a;
  font-weight: 300;
  letter-spacing: 0.05em;
}

/* 内化活动建议 - 标签形式 */
.internalization-activities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: clamp(1rem, 4vw, 3rem) 0;
  max-width: 600px;
  width: 100%;
  position: relative;
  z-index: 1;
  justify-content: center;
}
.internalization-activity-tag {
  padding: 0.75rem 1.25rem !important;
  font-size: clamp(0.9rem, 2vw, 1rem) !important;
  line-height: 1.6 !important;
  border-radius: 20px !important;
  border: 1px solid rgba(56, 239, 125, 0.2) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px) !important;
  color: #2d3a34 !important;
  font-weight: 400 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
  animation: fadeInUp 0.6s ease-out both !important;
  cursor: pointer !important;
  max-width: 100% !important;
  word-break: break-word !important;
}

.internalization-activity-tag:nth-child(1) {
  animation-delay: 0.1s;
}
.internalization-activity-tag:nth-child(3) {
  animation-delay: 0.3s;
}

.internalization-activity-tag:nth-child(4) {
  animation-delay: 0.4s;
}
.internalization-activity-tag:hover {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(56, 239, 125, 0.4) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 16px rgba(56, 239, 125, 0.15) !important;
}
/* 响应式调整 */
@media (max-width: 768px) {
  .internalization-activities {
    gap: 0.5rem;
  }
  
  .internalization-activity-tag {
    padding: 0.6rem 1rem !important;
    font-size: 0.85rem !important;
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.letter-to-future-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  z-index: 1;
}

.letter-card {
  position: relative;
  padding: clamp(2.5rem, 5vw, 3.5rem);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(56, 239, 125, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(56, 239, 125, 0.1);
  animation: letterCardAppear 1s ease-out;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  /* 信封形状的clip-path */
  clip-path: polygon(
    0% 15%,     /* 左上角 */
    15% 0%,    /* 顶部左 */
    85% 0%,    /* 顶部右 */
    100% 15%,  /* 右上角 */
    100% 85%,  /* 右侧 */
    85% 100%,  /* 底部右 */
    15% 100%,  /* 底部左 */
    0% 85%     /* 左侧 */
  );
  /* 备用圆角，如果clip-path不支持 */
  border-radius: clamp(24px, 5vw, 32px);
}

/* 信封收起动画 */
.letter-card.letter-closing {
  transform: scale(0.95);
  padding: clamp(1.5rem, 3vw, 2rem);
  /* 收起时保持信封形状 */
  clip-path: polygon(
    0% 15%,     /* 左上角 */
    15% 0%,    /* 顶部左 */
    85% 0%,    /* 顶部右 */
    100% 15%,  /* 右上角 */
    100% 85%,  /* 右侧 */
    85% 100%,  /* 底部右 */
    15% 100%,  /* 底部左 */
    0% 85%     /* 左侧 */
  );
}

.letter-card.letter-closing .letter-input-area,
.letter-card.letter-closing .letter-actions {
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.4s ease;
  pointer-events: none;
  max-height: 0;
  overflow: hidden;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

@keyframes letterCardAppear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.letter-icon {
  font-size: clamp(4rem, 8vw, 5rem);
  text-align: center;
  margin-bottom: 2rem;
  animation: gentlePulse 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  transition: all 0.3s ease;
}

.letter-icon:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
}

.letter-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: #2d3a34;
  text-align: center;
  margin: 0 0 0.75rem;
}

.letter-hint {
  font-size: clamp(0.875rem, 1.8vw, 1rem);
  color: #66707a;
  text-align: center;
  margin: 0 0 clamp(2rem, 1vw, 2.5rem);
  font-weight: 300;
}


.letter-input-area {
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
}

.letter-textarea {
  width: 100%;
  border-radius: 16px;
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  transition: all 0.3s ease;
  background: transparent;
  border: 1px solid rgb(0 0 0 / 10%) !important;
  box-shadow: none;
}

.letter-textarea:focus-within {
  box-shadow: 0 0 0 2px rgba(56, 239, 125, 0.2);
}


.letter-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.save-letter-btn {
  min-width: 160px;
  height: 48px;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 500;
}

/* 盖章后的信封卡片 */
.letter-sealed-card {
  position: relative;
  padding: clamp(2.5rem, 5vw, 3.5rem);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(56, 239, 125, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(56, 239, 125, 0.15);
  text-align: center;
  animation: sealedCardAppear 0.8s ease-out;
  /* 信封形状的clip-path */
  clip-path: polygon(
    0% 15%,     /* 左上角 */
    15% 0%,    /* 顶部左 */
    85% 0%,    /* 顶部右 */
    100% 15%,  /* 右上角 */
    100% 85%,  /* 右侧 */
    85% 100%,  /* 底部右 */
    15% 100%,  /* 底部左 */
    0% 85%     /* 左侧 */
  );
  /* 备用圆角 */
  border-radius: clamp(24px, 5vw, 32px);
}

@keyframes sealedCardAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.sealed-envelope {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  animation: envelopeSeal 1.2s ease-out;
}

@keyframes envelopeSeal {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.85);
  }
  75% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

.envelope-icon {
  font-size: clamp(4.5rem, 9vw, 5.5rem);
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  animation: gentlePulse 4s ease-in-out infinite;
}

.seal-stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(2rem, 4vw, 2.5rem);
  color: rgba(17, 153, 142, 0.9);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  width: clamp(60px, 12vw, 80px);
  height: clamp(60px, 12vw, 80px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(17, 153, 142, 0.6);
  box-shadow: 
    0 4px 12px rgba(17, 153, 142, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.5);
  animation: stampPress 0.6s ease-out 0.3s both;
  z-index: 2;
}

@keyframes stampPress {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(-10deg);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.15) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
}

.sealed-message {
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
  font-weight: 500;
  color: #2d3a34;
  margin: 0 0 0.5rem;
}

.sealed-hint {
  font-size: clamp(0.875rem, 1.6vw, 1rem);
  color: #66707a;
  font-weight: 300;
  margin: 0;
  font-style: italic;
}

/* 信封密封过渡动画 */
.envelope-seal-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.envelope-seal-leave-active {
  transition: all 0.4s ease;
}

.envelope-seal-enter-from,
.envelope-seal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.edit-letter-again {
  margin-top: 1.5rem;
  text-align: center;
}

.letter-saved-hint {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(56, 239, 125, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(17, 153, 142, 0.9);
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  animation: slideUp 0.4s ease-out;
}

.internalization-background {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><path d="M0,400 Q300,300 600,400 T1200,400 L1200,600 L0,600 Z" fill="%2338ef7d"/></svg>');
  background-size: cover;
  background-position: center;
  pointer-events: none;
  z-index: 0;
}

.internalization-transition {
  margin-top: clamp(2rem, 4vw, 3rem);
  text-align: center;
  animation: slideUp 0.6s ease-out;
}

/* ⑤ 转化阶段：旅程的延续样式 */
.transform-stage {
  position: relative;
  min-height: 100vh;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(247, 251, 249, 0.95) 50%,
    rgba(240, 248, 245, 0.98) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
}

.transform-header {
  text-align: center;
  margin-bottom: clamp(3rem,4rem);
  animation: fadeInDown 0.8s ease-out;
}

.transform-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 400;
  color: #2d3a34;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.transform-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #66707a;
  font-weight: 300;
  letter-spacing: 0.05em;
}

.traveler-stories-section {
  width: 100%;
  max-width: 1000px;
  margin-bottom: clamp(3rem, 6vw, 4rem);
}

.stories-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 clamp(2rem, 4vw, 3rem);
  text-align: center;
  justify-content: center;
}

.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1.5rem, 3vw, 2rem);
}

.story-card {
  padding: clamp(1.5rem, 3vw, 2rem);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(56, 239, 125, 0.15);
  opacity: 0;
  transform: translateY(20px);
  animation: storyAppear 0.6s ease-out forwards;
  animation-delay: calc(var(--story-delay, 0s) + 0.3s);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.story-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

@keyframes storyAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.story-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.story-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(56, 239, 125, 0.3);
}

.story-info {
  flex: 1;
}

.story-name {
  font-size: clamp(1rem, 2vw, 1.125rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 0.25rem;
}

.story-meta {
  font-size: clamp(0.75rem, 1.5vw, 0.875rem);
  color: #66707a;
  margin: 0;
}

.story-content {
  font-size: clamp(0.95rem, 1.8vw, 1.05rem);
  line-height: 1.8;
  color: #2d3a34;
  margin: 0 0 1rem;
}

.story-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.story-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(56, 239, 125, 0.1);
  border-radius: 12px;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  color: rgba(17, 153, 142, 0.8);
}

.community-section {
  width: 100%;
  max-width: 600px;
  margin-bottom: clamp(3rem, 6vw, 4rem);
}

.community-card {
  padding: clamp(2.5rem, 5vw, 3.5rem);
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.1), rgba(17, 153, 142, 0.1));
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(56, 239, 125, 0.3);
  text-align: center;
  box-shadow: 0 8px 32px rgba(56, 239, 125, 0.1);
}

.community-icon {
  font-size: clamp(3rem, 6vw, 4rem);
  margin-bottom: 1.5rem;
  animation: gentlePulse 3s ease-in-out infinite;
}

.community-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 1rem;
}

.community-description {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  color: #66707a;
  margin: 0 0 2rem;
}

.community-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.share-story-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  border: none !important;
  border-radius: 24px !important;
  height: 48px !important;
  padding: 0 2rem !important;
  font-size: 1rem !important;
  font-weight: 500 !important;
  box-shadow: 0 6px 20px rgba(17, 153, 142, 0.25) !important;
  transition: all 0.3s ease !important;
}

.share-story-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(17, 153, 142, 0.35) !important;
}

.join-community-btn {
  border-radius: 24px !important;
  height: 48px !important;
  padding: 0 2rem !important;
  font-size: 1rem !important;
  font-weight: 500 !important;
  border: 1.5px solid rgba(56, 239, 125, 0.3) !important;
  color: rgba(17, 153, 142, 0.9) !important;
  transition: all 0.3s ease !important;
}

.join-community-btn:hover {
  border-color: rgba(56, 239, 125, 0.5) !important;
  background: rgba(56, 239, 125, 0.05) !important;
  color: rgba(17, 153, 142, 1) !important;
  transform: translateY(-2px) !important;
}

.transform-ending {
  text-align: center;
  padding: clamp(2rem, 4vw, 3rem) 0;
  animation: fadeIn 1.5s ease-out;
}

.ending-text {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 300;
  color: rgba(17, 153, 142, 0.9);
  margin: 0;
  letter-spacing: 0.1em;
  font-style: italic;
  animation: endingGlow 3s ease-in-out infinite;
}

/* 旅行后延伸挑战样式 */
.post-journey-challenge-section {
  margin-top: clamp(3rem, 6vw, 4rem);
  padding: clamp(2rem, 4vw, 3rem);
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.08), rgba(17, 153, 142, 0.08));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(56, 239, 125, 0.2);
}

.challenge-section-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.challenge-section-card {
  background: rgba(255, 255, 255, 0.6);
  padding: clamp(1.5rem, 3vw, 2rem);
  border-radius: 16px;
  border: 1px solid rgba(56, 239, 125, 0.15);
}

.challenge-section-description {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  color: #66707a;
  margin: 0 0 1.5rem;
}

.challenge-actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.challenge-action-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 3px solid rgba(17, 153, 142, 0.4);
  transition: all 0.3s ease;
}

.challenge-action-item:hover {
  border-left-color: rgba(17, 153, 142, 0.8);
  background: rgba(255, 255, 255, 0.95);
}

.action-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.2), rgba(56, 239, 125, 0.2));
  border-radius: 50%;
  font-weight: 600;
  color: rgba(17, 153, 142, 0.9);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.action-text {
  font-size: clamp(0.95rem, 1.8vw, 1.05rem);
  line-height: 1.7;
  color: #2d3a34;
  flex: 1;
}

/* 悬浮圆形按钮和展开面板 */
.floating-design-btn-wrapper {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

/* 悬浮圆形按钮 */
.floating-design-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.95), rgba(56, 239, 125, 0.95));
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 24px rgba(17, 153, 142, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  outline: none;
}

.floating-design-btn:hover {
  transform: scale(1.1);
  box-shadow: 
    0 12px 32px rgba(17, 153, 142, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.15);
}

.floating-design-btn.expanded {
  background: linear-gradient(135deg, rgba(255, 77, 77, 0.95), rgba(255, 107, 107, 0.95));
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-icon {
  font-size: 1.8rem;
  line-height: 1;
  color: white;
  transition: transform 0.3s ease;
}

.floating-design-btn.expanded .btn-icon {
  transform: rotate(90deg);
}

/* 展开面板 */
.design-panel {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 380px;
  max-height: calc(100vh - 150px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(30px);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(17, 153, 142, 0.15);
  border: 1px solid rgba(56, 239, 125, 0.2);
  overflow: hidden;
  z-index: 1001;
}

.panel-content {
  padding: 1.5rem;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(17, 153, 142, 0.3);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(17, 153, 142, 0.5);
}

/* 遮罩层 */
.design-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 1000;
}
/* 展开动画 */
.panel-expand-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-expand-leave-active {
  transition: all 0.25s ease-in;
}

.panel-expand-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.panel-expand-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
@media (max-width: 768px) {
  .floating-design-btn-wrapper {
    bottom: 20px;
    right: 20px;
  }
  
  .floating-design-btn {
    width: 56px;
    height: 56px;
  }
  
  .design-panel {
    right: 20px;
    bottom: 90px;
    width: calc(100vw - 40px);
    max-width: 380px;
  }
}
/* 统一侧边栏区域 */
.unified-sidebar-section {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.unified-section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 1.5rem;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(56, 239, 125, 0.2);
}
.part-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(17, 153, 142, 0.9);
  margin: 0 0 1rem;
}

.healing-design-part {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(17, 153, 142, 0.15);
}

.healing-design-part:last-child,
.cognitive-triggers-part:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.cognitive-triggers-part {
  margin-top: 0;
}

.healing-design-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.healing-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.08), rgba(17, 153, 142, 0.08));
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(56, 239, 125, 0.2);
  transition: all 0.3s ease;
}

.healing-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(56, 239, 125, 0.15);
  border-color: rgba(56, 239, 125, 0.4);
}

.healing-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.healing-content {
  flex: 1;
}

.healing-content h5 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 0.35rem;
}

.healing-content p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #66707a;
  margin: 0;
}

/* 认知触发机制样式 */
.cognitive-triggers-section {
  margin-top: clamp(3rem, 6vw, 4rem);
  padding: clamp(2rem, 4vw, 3rem);
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.05), rgba(56, 239, 125, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(17, 153, 142, 0.15);
}

.triggers-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.triggers-group {
  background: rgba(255, 255, 255, 0.7);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(17, 153, 142, 0.15);
}

.triggers-group-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 0.75rem;
}

.triggers-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.trigger-item {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #66707a;
  padding: 0.6rem 0.85rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border-left: 3px solid rgba(17, 153, 142, 0.3);
}

.transformation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(17, 153, 142, 0.15);
}

.transformation-tag {
  font-size: 0.85rem;
  padding: 0.4rem 0.85rem;
  background: rgba(17, 153, 142, 0.1);
  color: rgba(17, 153, 142, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(17, 153, 142, 0.3);
  transition: all 0.3s ease;
  cursor: default;
}

.transformation-tag:hover {
  background: rgba(17, 153, 142, 0.15);
  border-color: rgba(17, 153, 142, 0.5);
  transform: translateY(-1px);
}

/* 关键词总结样式 */
.keywords-section {
  margin-top: clamp(2rem, 4vw, 3rem);
  padding: 2rem;
  text-align: center;
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.keyword-tag {
  font-size: 0.95rem !important;
  padding: 0.5rem 1rem !important;
  border-radius: 20px !important;
}

/* 旅程概览区域样式 */
.journey-overview-section {
  margin-bottom: clamp(2rem, 4vw, 3rem);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.journey-background-card,
.journey-story-card {
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.08), rgba(17, 153, 142, 0.08));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: clamp(2rem, 4vw, 3rem);
  margin-bottom: 2rem;
  border: 1px solid rgba(56, 239, 125, 0.2);
  box-shadow: 0 8px 32px rgba(56, 239, 125, 0.1);
}

.background-icon,
.story-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.background-title,
.story-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 1rem;
}

.background-text,
.story-text {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  color: #66707a;
  margin: 0;
}

.destinations-detail-section,
.global-highlights-section,
.mental-flow-overview {
  margin-top: clamp(3rem, 6vw, 4rem);
}

.destinations-title,
.highlights-title,
.flow-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 2rem;
  text-align: center;
}

.destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.destination-detail-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: clamp(1.5rem, 3vw, 2rem);
  border: 1px solid rgba(56, 239, 125, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.destination-detail-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(56, 239, 125, 0.15);
  border-color: rgba(56, 239, 125, 0.4);
}

.dest-name {
  font-size: clamp(1.3rem, 2.5vw, 1.6rem);
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 1rem;
}

.dest-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.9rem;
  color: #66707a;
  padding: 0.25rem 0.75rem;
  background: rgba(56, 239, 125, 0.1);
  border-radius: 12px;
}

.dest-message {
  font-size: 1rem;
  line-height: 1.7;
  color: #66707a;
  margin: 0 0 1.5rem;
  font-style: italic;
}

.dest-highlights {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.highlight-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 3px solid rgba(17, 153, 142, 0.3);
}

.highlight-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.highlight-content {
  flex: 1;
}

.highlight-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 0.5rem;
}

.highlight-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #66707a;
  margin: 0 0 0.5rem;
}

.highlight-feeling {
  font-size: 0.85rem;
  color: rgba(17, 153, 142, 0.9);
  font-style: italic;
  margin: 0;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.highlight-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(56, 239, 125, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.highlight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(56, 239, 125, 0.15);
}

.highlight-card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3a34;
  margin: 0 0 0.75rem;
}

.highlight-card-description {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #66707a;
  margin: 0 0 0.5rem;
}

.highlight-card-feeling {
  font-size: 0.85rem;
  color: rgba(17, 153, 142, 0.9);
  font-style: italic;
  margin: 0;
}

/* 五段心智流快速导航样式 */
.mental-flow-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
}

.flow-nav-icons {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.nav-icon-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(56, 239, 125, 0.3);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0;
}

.nav-icon-btn:hover {
  transform: translateY(-4px) scale(1.1);
  border-color: rgba(56, 239, 125, 0.6);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 20px rgba(56, 239, 125, 0.2);
}

.nav-icon-btn:active {
  transform: translateY(-2px) scale(1.05);
}

.nav-icon {
  font-size: 1.8rem;
  line-height: 1;
  display: block;
}

@media (max-width: 768px) {
  .destinations-grid,
  .highlights-grid {
    grid-template-columns: 1fr;
  }
  
  .flow-nav-icons {
    gap: 1rem;
  }
  
  .nav-icon-btn {
    width: 48px;
    height: 48px;
  }
  
  .nav-icon {
    font-size: 1.5rem;
  }
}

@keyframes endingGlow {
  0%, 100% {
    opacity: 0.8;
    text-shadow: 0 2px 10px rgba(56, 239, 125, 0.2);
  }
  50% {
    opacity: 1;
    text-shadow: 0 4px 20px rgba(56, 239, 125, 0.4);
  }
}

/* 🎨 层2：灵感景象（Mood Space）样式 */
.mood-space {
  position: relative;
  min-height: 600px;
  padding: clamp(2rem, 5vw, 4rem) 0;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  overflow: hidden;
}

/* 浮动图像板 - 视差漂浮效果 */
.floating-images-board {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-image-item {
  position: absolute;
  width: clamp(120px, 15vw, 200px);
  height: clamp(120px, 15vw, 200px);
  left: var(--x);
  top: var(--y);
  transform: translate(-50%, -50%) rotate(var(--rotation));
  transform-style: preserve-3d;
  animation: float-parallax 20s ease-in-out infinite;
  animation-delay: var(--parallax-delay, var(--delay));
  opacity: 0.4;
  filter: blur(1px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  z-index: calc(var(--z-layer, 0) + 1);
  will-change: transform;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.floating-image-item:hover {
  opacity: 0.7;
  filter: blur(0.5px);
  z-index: 100;
}

.floating-image-item .parallax-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.image-float-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(56, 239, 125, 0.3), transparent);
  border-radius: 30px;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes float-parallax {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) rotate(calc(var(--rotation) + 5deg)) translateY(-30px);
  }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* AI旁白 */
.mood-ai-narration {
  position: relative;
  z-index: 2;
  text-align: center;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  padding: 0 clamp(1rem, 3vw, 2rem);
}

.narration-text {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(17, 153, 142, 0.85);
  font-style: italic;
  line-height: 1.8;
  text-shadow: 0 2px 10px rgba(17, 153, 142, 0.2);
}

/* AI灵感摘要 - 玻璃态卡片 */
.summary-glass-card {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto clamp(2rem, 4vw, 3rem);
  margin-bottom: clamp(3rem, 5vw, 4rem);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: clamp(1.5rem, 3vw, 2rem);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  isolation: isolate;
}

.summary-editable {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.summary-text-glass {
  flex: 1;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
}

.edit-icon-btn {
  flex-shrink: 0;
  color: rgba(17, 153, 142, 0.7);
  transition: all 0.3s ease;
}

.edit-icon-btn:hover {
  color: rgba(17, 153, 142, 1);
  transform: scale(1.1);
}

.summary-input-glass {
  width: 100%;
}

/* 漂浮的灵感场景球体 - 动态关键词气泡 */
.floating-mood-sphere {
  position: relative;
  z-index: 2;
  min-height: 300px;
  margin: clamp(2rem, 4vw, 3rem) 0;
}

.mood-bubble {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: clamp(80px, 10vw, 120px);
  height: clamp(80px, 10vw, 120px);
  cursor: pointer;
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  animation: bubble-float-bounce 8s ease-in-out infinite,
             bubble-gentle-rotate var(--rotation-speed, 15s) linear infinite,
             bubble-breathe 4s ease-in-out infinite;
  animation-delay: var(--delay), 0s, calc(var(--delay) * 0.5);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: var(--z-index, 1);
  will-change: transform, opacity;
}

.mood-bubble.bubble-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.mood-bubble:hover {
  transform: translate(-50%, -50%) scale(1.2) !important;
  z-index: 100 !important;
  animation-play-state: paused, paused, running;
}

.mood-bubble.explored .bubble-content {
  border-color: rgba(56, 239, 125, 0.5);
  box-shadow: 
    0 8px 24px rgba(56, 239, 125, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 0 2px rgba(56, 239, 125, 0.2);
}

.mood-bubble.expanded {
  z-index: 200 !important;
  transform: translate(-50%, -50%) scale(1.3);
}

.mood-bubble.has-images .bubble-content::after {
  content: '';
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: rgba(56, 239, 125, 0.9);
  border-radius: 50%;
  border: 2px solid white;
}

.mood-bubble.add-bubble-btn .bubble-content {
  background: rgba(56, 239, 125, 0.2);
  border: 2px dashed rgba(56, 239, 125, 0.5);
}

.mood-bubble.add-bubble-btn:hover .bubble-content {
  background: rgba(56, 239, 125, 0.3);
  border-color: rgba(56, 239, 125, 0.7);
}

.bubble-image-count {
  position: absolute;
  bottom: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  background: rgba(56, 239, 125, 0.9);
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border: 2px solid white;
  font-weight: 600;
}

.bubble-upload-hint {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.mood-bubble:hover .bubble-upload-hint {
  opacity: 1;
}

.bubble-glow {
  position: absolute;
  inset: -15px;
  background: radial-gradient(circle, rgba(56, 239, 125, 0.4), transparent);
  border-radius: 50%;
  animation: bubble-glow-pulse 3s ease-in-out infinite;
  animation-delay: var(--delay);
}

.bubble-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(56, 239, 125, 0.3);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 
    0 8px 24px rgba(56, 239, 125, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.4s ease;
}

.mood-bubble:hover .bubble-content {
  border-color: rgba(56, 239, 125, 0.6);
  box-shadow: 
    0 12px 32px rgba(56, 239, 125, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.bubble-icon {
  font-size: clamp(1.5rem, 2vw, 2rem);
  line-height: 1;
}

.bubble-text {
  font-size: clamp(0.75rem, 1vw, 0.875rem);
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
  white-space: nowrap;
}
.bubble-ring {
  position: absolute;
  inset: -5px;
  border: 2px solid rgba(56, 239, 125, 0.2);
  border-radius: 50%;
  animation: ring-rotate 8s linear infinite;
}
@keyframes bubble-float-bounce {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0) translateX(0) scale(1);
  }
  25% {
    transform: translate(-50%, -50%) translateY(-15px) translateX(3px) scale(1.05);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-25px) translateX(-2px) scale(1.02);
  }
  75% {
    transform: translate(-50%, -50%) translateY(-10px) translateX(2px) scale(1.03);
  }
}
@keyframes bubble-gentle-rotate {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  25% {
    transform: translate(-50%, -50%) rotate(2deg);
  }
  50% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  75% {
    transform: translate(-50%, -50%) rotate(-2deg);
  }
}
@keyframes bubble-breathe {
  0%, 100% {
    opacity: 0.9;
    filter: brightness(1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.15);
  }
}
@keyframes bubble-glow-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
@keyframes ring-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 节点连接线动画 */
.bubble-connections {
  opacity: 0;
  animation: connections-fade-in 1s ease-out 0.5s forwards;
}

.connection-line {
  opacity: 0;
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: line-draw 1.5s ease-out forwards;
  animation-delay: calc(0.8s + var(--conn-delay, 0s));
}

@keyframes connections-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes line-draw {
  to {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

/* 展开卡片样式 */
.bubble-expanded-card {
  position: fixed;
  left: var(--bubble-x);
  top: var(--bubble-y);
  transform: translate(-50%, 0);
  width: min(400px, 85vw);
  max-height: calc(100vh - 2rem);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: clamp(1.5rem, 3vw, 2rem);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 0 0 2px rgba(56, 239, 125, 0.3);
  z-index: 200;
  overflow-y: auto;
  border: 1px solid rgba(56, 239, 125, 0.2);
  /* 确保卡片不会被截断 */
  max-width: calc(100vw - 2rem);
  /* 如果内容过多，允许滚动 */
  display: flex;
  flex-direction: column;
}

/* 确保展开卡片在视口范围内 - 使用JavaScript动态调整 */

/* 当有模态框打开时，降低展开卡片的 z-index 并禁用交互 */
.experience-day.has-modal-open .bubble-expanded-card {
  z-index: 1 !important;
  pointer-events: none !important;
  opacity: 0.3 !important;
}

/* 当有模态框打开时，降低旅程轨迹的 z-index */
.experience-day.has-modal-open .journey-trail {
  z-index: 1 !important;
  pointer-events: none !important;
  opacity: 0.3 !important;
}

.expanded-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.expanded-card-title {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.8), rgba(17, 153, 142, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-expanded-btn {
  color: rgba(0, 0, 0, 0.5);
}

.expanded-philosophy {
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(1rem, 2vw, 1.5rem);
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.08), rgba(17, 153, 142, 0.05));
  border-radius: 16px;
  border-left: 3px solid rgba(56, 239, 125, 0.4);
}

.philosophy-text {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.75);
  font-style: italic;
  margin: 0;
  text-align: center;
}

.expanded-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.expanded-image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.9);
  animation: image-appear 0.5s ease-out forwards;
  animation-delay: var(--img-delay, 0s);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
}

.expanded-image-item:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.expanded-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.expanded-image-item:hover img {
  transform: scale(1.05);
}

.expanded-image-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(56, 239, 125, 0.08);
  border: 2px dashed rgba(56, 239, 125, 0.3);
  gap: 0.5rem;
}

.expanded-image-add:hover {
  background: rgba(56, 239, 125, 0.12);
  border-color: rgba(56, 239, 125, 0.5);
}

.expanded-image-add .add-icon {
  font-size: 2rem;
  color: rgba(56, 239, 125, 0.7);
}

.expanded-image-add .add-text {
  font-size: 0.75rem;
  color: rgba(56, 239, 125, 0.8);
  font-weight: 500;
}

@keyframes image-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.expanded-images-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(2rem, 4vw, 3rem);
  gap: 1rem;
  text-align: center;
}

.placeholder-icon {
  font-size: clamp(3rem, 6vw, 4rem);
  color: rgba(56, 239, 125, 0.3);
}

.placeholder-text {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* 展开动画 */
.bubble-expand-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-expand-leave-active {
  transition: all 0.3s ease-in;
}

.bubble-expand-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}

.bubble-expand-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.95);
}

/* 右上角旅程轨迹线 */
.journey-trail {
  position: fixed;
  top: clamp(1rem, 2vw, 1.5rem);
  right: clamp(1rem, 2vw, 1.5rem);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: clamp(0.75rem, 1.5vw, 1rem);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(56, 239, 125, 0.2);
  min-width: 140px;
  max-width: 180px;
  max-height: calc(100vh - clamp(2rem, 4vw, 3rem) - 100px);
  overflow-y: auto;
  overflow-x: hidden;
  opacity: 0;
  transform: translateX(20px);
  animation: trail-fade-in 0.6s ease-out forwards;
  pointer-events: auto;
}

/* 自定义滚动条样式 */
.journey-trail::-webkit-scrollbar {
  width: 4px;
}

.journey-trail::-webkit-scrollbar-track {
  background: rgba(56, 239, 125, 0.1);
  border-radius: 2px;
}

.journey-trail::-webkit-scrollbar-thumb {
  background: rgba(56, 239, 125, 0.3);
  border-radius: 2px;
}

.journey-trail::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 239, 125, 0.5);
}

.trail-title {
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  font-weight: 600;
  color: rgba(17, 153, 142, 0.9);
  margin-bottom: clamp(0.5rem, 1vw, 0.75rem);
  text-align: center;
}

.trail-nodes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.trail-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: rgba(56, 239, 125, 0.1);
  border-radius: 8px;
  font-size: clamp(0.75rem, 1vw, 0.875rem);
  opacity: 0;
  transform: translateX(-10px);
  animation: node-appear 0.4s ease-out forwards;
  animation-delay: var(--trail-delay, 0s);
  border: 1px solid rgba(56, 239, 125, 0.2);
}

.trail-node-icon {
  font-size: 1rem;
  line-height: 1;
}

.trail-node-text {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
}

.trail-line {
  position: absolute;
  left: 20px;
  top: 28px;
  bottom: 28px;
  width: 2px;
  background: linear-gradient(to bottom, rgba(56, 239, 125, 0.3), rgba(56, 239, 125, 0.1));
  opacity: 0;
  animation: line-extend 0.8s ease-out 0.3s forwards;
}

@keyframes trail-fade-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes node-appear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes line-extend {
  from {
    opacity: 0;
    height: 0;
  }
  to {
    opacity: 1;
    height: calc(100% - 56px);
  }
}

/* 背景切换效果 */
.mood-space {
  position: relative;
  transition: background-image 1s ease-in-out, background-position 2s ease-in-out;
}

.mood-space[style*="--bg-image"]::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.15;
  z-index: 0;
  filter: blur(40px);
  transition: opacity 1s ease-in-out, transform 3s ease-in-out;
  transform: scale(1.1);
  animation: background-shift 8s ease-in-out infinite;
}

@keyframes background-shift {
  0%, 100% {
    transform: scale(1.1) translateX(0);
  }
  50% {
    transform: scale(1.15) translateX(-10px);
  }
}

/* 哲思句动态切换 */
.philosophy-sentence {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.experience-day.has-background-switch .mood-space::before {
  animation: background-shift 8s ease-in-out infinite, background-breathe 4s ease-in-out infinite;
}

@keyframes background-breathe {
  0%, 100% {
    opacity: 0.12;
  }
  50% {
    opacity: 0.18;
  }
}

/* 分隔过渡层 */
.section-divider {
  position: relative;
  height: clamp(2rem, 4vw, 3rem);
  margin: clamp(2rem, 4vw, 3rem) 0;
  overflow: hidden;
  pointer-events: none;
}

.section-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(56, 239, 125, 0.2) 15%,
    rgba(56, 239, 125, 0.4) 50%,
    rgba(56, 239, 125, 0.2) 85%,
    transparent 100%
  );
  transform: translateY(-50%);
}

.section-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: rgba(56, 239, 125, 0.5);
  border-radius: 50%;
  box-shadow: 
    0 0 0 4px rgba(56, 239, 125, 0.1),
    0 0 12px rgba(56, 239, 125, 0.3);
}

/* 🗺️ 推荐目的地卡片 - 新设计规范 */
.destinations-page {
  position: relative;
  z-index: 3;
  margin-top: clamp(3rem, 6vw, 5rem);
  padding: clamp(2rem, 4vw, 3rem) 0;
  min-height: auto;
  background: linear-gradient(180deg, 
    rgba(247, 251, 249, 0.95) 0%, 
    rgba(255, 255, 255, 1) 20%,
    rgba(255, 255, 255, 1) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  isolation: isolate;
  /* 确保内容完整显示 */
  overflow: visible;
}

/* 分隔线 */
.destinations-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(80%, 600px);
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(56, 239, 125, 0.3) 20%,
    rgba(56, 239, 125, 0.5) 50%,
    rgba(56, 239, 125, 0.3) 80%,
    transparent 100%
  );
  box-shadow: 0 1px 3px rgba(56, 239, 125, 0.2);
}

/* 标题过渡区 */
.destinations-header {
  position: relative;
  z-index: 4;
  width: min(1000px, 92%);
  margin: clamp(2rem, 4vw, 3rem) auto clamp(1.5rem, 3vw, 2rem);
  padding: clamp(1.5rem, 3vw, 2rem) clamp(1rem, 3vw, 2rem);
  text-align: center;
  opacity: 0;
  transform: translateY(10px);
  animation: headerFadeIn 0.6s ease-out 0.2s forwards;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%,
    rgba(247, 251, 249, 0.85) 100%
  );
  backdrop-filter: blur(15px) saturate(180%);
  -webkit-backdrop-filter: blur(15px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(56, 239, 125, 0.15);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(56, 239, 125, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  margin-bottom: clamp(2rem, 4vw, 3rem);
}

.destinations-title {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.7), rgba(17, 153, 142, 0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.destinations-subtitle {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
  font-style: italic;
  font-weight: 400;
}

@keyframes headerFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.destinations-grid {
  width: min(1000px, 92%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 0 clamp(1rem, 3vw, 2rem);
  /* 确保内容不被截断 */
  overflow: visible;
  min-height: auto;
}

@media (max-width: 1080px) {
  .destinations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .destinations-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

/* 卡片样式 - 雾面＋柔光渐层，错乱布局 */
.destination-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  color: #2B2F2E;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.58));
  border: 1px solid rgba(120, 160, 140, 0.18);
  box-shadow: 0 2px 8px rgba(20, 48, 40, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1),
              box-shadow 260ms cubic-bezier(0.22, 0.61, 0.36, 1),
              border-color 160ms cubic-bezier(0.22, 0.61, 0.36, 1);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
  touch-action: manipulation;
  opacity: 0.9;
  --card-scale: 1;
  animation: breatheIn 420ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 60ms);
}

.destination-card.is-visible {
  opacity: 1;
}

.destination-card:focus-within {
  outline: none;
  border-color: rgba(10, 132, 255, 0.35);
  box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.08);
}

/* 高低错落 */
.destination-card.tall {
  min-height: 130px;
}

.destination-card.normal {
  min-height: 100px;
}

/* 不同大小 - 通过CSS变量控制scale */
.destination-card.size-small {
  --card-scale: 0.92;
}

.destination-card.size-medium {
  --card-scale: 0.96;
}

.destination-card.size-normal {
  --card-scale: 1;
}

.destination-card {
  transform: scale(var(--card-scale, 1)) translate(var(--offset-x, 0), var(--offset-y, 0)) rotate(var(--rotation, 0deg));
}

.destination-card.is-visible {
  transform: scale(var(--card-scale, 1)) translate(var(--offset-x, 0), var(--offset-y, 0)) rotate(var(--rotation, 0deg));
}

.destination-card:hover {
  transform: scale(calc(var(--card-scale, 1) * 1.02)) translate(calc(var(--offset-x, 0)), calc(var(--offset-y, 0) - 2px)) rotate(var(--rotation, 0deg));
}

/* 标题、文案 - 缩小尺寸 */
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #444;
  letter-spacing: 0.1px;
  margin: 0;
  line-height: 1.3;
}

.card-lede {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin: 0;
  font-weight: 400;
}

.card-meta {
  font-size: 11px;
  color: #66707A;
  margin: 0;
  line-height: 1.4;
}

/* 情绪标签 Chip - 缩小 */
.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  color: #2D3A34;
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(6px);
  font-weight: 500;
}

.chip.explore {
  background: #E6F3FF;
}

.chip.heal {
  background: #F7EDF9;
}

.chip.city {
  background: #FFF5E5;
}

.chip.nature {
  background: #E8F9F3;
}



/* 轻入场动画 - 配合错乱效果 */
@keyframes breatheIn {
  from {
    opacity: 0;
    transform: scale(calc(var(--card-scale, 1) * 0.95)) translate(calc(var(--offset-x, 0) * 0.5), calc(6px + var(--offset-y, 0) * 0.5)) rotate(calc(var(--rotation, 0deg) * 0.5));
  }
  to {
    opacity: 0.9;
    transform: scale(var(--card-scale, 1)) translate(var(--offset-x, 0), var(--offset-y, 0)) rotate(var(--rotation, 0deg));
  }
}

/* 视觉拼贴覆盖层 - Vision Pro风格 */
.visual-collage-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem);
}
.collage-card-spatial {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  border-radius: 32px;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  max-width: 900px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: spatial-appear 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.collage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.collage-header h4 {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
}

.close-btn-glass {
  color: rgba(0, 0, 0, 0.5);
}
.collage-images {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(0.75rem, 1.5vw, 1rem);
}
.collage-img-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  animation: collage-img-appear 0.4s ease-out;
  animation-delay: var(--delay);
  animation-fill-mode: both;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.collage-img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes spatial-appear {
  from {
  opacity: 0;
    transform: scale(0.9) translateY(20px);
}
  to {
  opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes collage-img-appear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
  opacity: 1;
    transform: scale(1);
  }
}
/* 过渡动画 */
.collage-fade-enter-active,
.collage-fade-leave-active {
  transition: all 0.3s ease;
}

.collage-fade-enter-from,
.collage-fade-leave-to {
    opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .experience-day {
    gap: clamp(0.75rem, 2vw, 1.5rem);
  }
  
  .floating-image-item {
    opacity: 0.3;
    width: clamp(80px, 12vw, 150px);
    height: clamp(80px, 12vw, 150px);
  }
  
  .mood-bubble {
    width: clamp(60px, 8vw, 100px);
    height: clamp(60px, 8vw, 100px);
  }
  
  .collage-images {
    grid-template-columns: 1fr;
  }
}

/* 🗺️ 层3：体验旅程（Journey Flow）样式 */
.journey-flow {
  position: relative;
  padding: clamp(2rem, 4vw, 3rem) 0;
  margin-bottom: clamp(2rem, 4vw, 3rem);
}

/* 标题区域 */
.journey-header {
  text-align: center;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  padding: 0 clamp(1rem, 3vw, 2rem);
}

.journey-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 clamp(0.75rem, 1.5vw, 1rem);
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.8), rgba(17, 153, 142, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.journey-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 1vw, 0.75rem);
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: rgba(0, 0, 0, 0.6);
}

.journey-location,
.journey-time {
  font-weight: 500;
}

.journey-separator {
  color: rgba(0, 0, 0, 0.3);
}

/* 时间段活动列表 */
.journey-timeline {
  display: flex;
  flex-direction: column;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
}

.rhythm-section {
  position: relative;
  padding: clamp(1.5rem, 3vw, 2rem);
  border-radius: clamp(20px, 4vw, 28px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  transform: translateY(0);
  animation: rhythm-appear 0.8s ease-out;
  animation-delay: var(--delay);
  animation-fill-mode: both;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.rhythm-section.rhythm-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 色调分层：早橙→白→夜蓝 */
.period-morning {
  background: linear-gradient(135deg, 
    rgba(255, 183, 77, 0.15) 0%,
    rgba(255, 224, 178, 0.1) 100%);
  border: 1px solid rgba(255, 183, 77, 0.2);
}

.period-morning .period-header {
  color: rgba(255, 152, 0, 0.9);
}

.period-morning .period-gradient-line {
  background: linear-gradient(90deg, rgba(255, 183, 77, 0.6), rgba(255, 224, 178, 0.3));
}

.period-afternoon {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(250, 250, 250, 0.9) 100%);
  border: 1px solid rgba(200, 200, 200, 0.3);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.05);
}

.period-afternoon .period-header {
  color: rgba(255, 193, 7, 0.9);
}

.period-afternoon .period-gradient-line {
  background: linear-gradient(90deg, rgba(255, 255, 200, 0.6), rgba(255, 255, 255, 0.3));
}

.period-evening {
  background: linear-gradient(135deg,
    rgba(17, 153, 142, 0.15) 0%,
    rgba(10, 120, 110, 0.1) 100%);
  border: 1px solid rgba(17, 153, 142, 0.2);
}

.period-evening .period-header {
  color: rgba(17, 153, 142, 0.9);
}

.period-evening .period-gradient-line {
  background: linear-gradient(90deg, rgba(17, 153, 142, 0.6), rgba(56, 239, 125, 0.3));
}

/* 沉浸模式下的强调效果 */
.rhythm-section.period-active {
  transform: scale(1.02);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 沉浸模式导航控件 */
.journey-timeline.immersion-timeline {
  position: relative;
}

.immersion-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 2vw, 1.5rem);
  margin-bottom: clamp(2rem, 4vw, 3rem);
  padding: clamp(1rem, 2vw, 1.5rem);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: clamp(20px, 4vw, 28px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.nav-btn {
  width: clamp(40px, 5vw, 48px);
  height: clamp(40px, 5vw, 48px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(56, 239, 125, 0.1);
  border: 1px solid rgba(56, 239, 125, 0.2);
  color: rgba(17, 153, 142, 0.9);
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(56, 239, 125, 0.2);
  border-color: rgba(56, 239, 125, 0.4);
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.period-indicators {
  display: flex;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  align-items: center;
}

.period-indicator {
  width: clamp(44px, 5.5vw, 52px);
  height: clamp(44px, 5.5vw, 52px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(56, 239, 125, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.period-indicator:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.period-indicator.active {
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.9), rgba(17, 153, 142, 0.9));
  border-color: rgba(56, 239, 125, 0.6);
  box-shadow: 
    0 4px 16px rgba(56, 239, 125, 0.3),
    0 0 0 4px rgba(56, 239, 125, 0.1);
  transform: scale(1.1);
}

.indicator-icon {
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  line-height: 1;
}

/* 时间段头部 */
.period-header {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.period-icon {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  line-height: 1;
}

.period-info {
  flex: 1;
}

.period-title {
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.period-gradient-line {
  height: 3px;
  border-radius: 2px;
  width: 100%;
  max-width: 200px;
}

/* 活动卡片列表 */
.activities-list {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.activity-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: clamp(16px, 3vw, 20px);
  padding: clamp(1rem, 2vw, 1.5rem);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.activity-card.activity-editing {
  border-color: rgba(56, 239, 125, 0.5);
  box-shadow: 0 0 0 2px rgba(56, 239, 125, 0.2);
}

.activity-main {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.5vw, 1rem);
}

.activity-time {
  margin-bottom: 0.5rem;
}

.time-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(56, 239, 125, 0.15);
  border: 1px solid rgba(56, 239, 125, 0.3);
  border-radius: 12px;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  font-weight: 600;
  color: rgba(17, 153, 142, 0.9);
}

.activity-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: clamp(1rem, 2vw, 1.5rem);
  align-items: start;
}

.activity-info {
  flex: 1;
}

.activity-title {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 clamp(0.5rem, 1vw, 0.75rem);
}

.activity-narration {
  display: flex;
  gap: 0.5rem;
  margin-bottom: clamp(0.75rem, 1.5vw, 1rem);
  padding: clamp(0.75rem, 1.5vw, 1rem);
  background: rgba(56, 239, 125, 0.05);
  border-left: 3px solid rgba(56, 239, 125, 0.3);
  border-radius: 8px;
}

.narration-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1.5;
}

.narration-text {
  flex: 1;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.7);
  font-style: italic;
  margin: 0;
}

.activity-actions {
  display: flex;
  gap: 0.5rem;
}

.activity-actions .ant-btn {
  color: rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

.activity-actions .ant-btn:hover {
  color: rgba(17, 153, 142, 0.8);
  background: rgba(56, 239, 125, 0.1);
}

.activity-actions .sound-active {
  color: rgba(17, 153, 142, 1);
  background: rgba(56, 239, 125, 0.15);
}

/* 活动图片 */
.activity-image-wrapper {
  flex-shrink: 0;
  width: clamp(120px, 15vw, 180px);
  height: clamp(120px, 15vw, 180px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.activity-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(56, 239, 125, 0.05);
  border: 2px dashed rgba(56, 239, 125, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(17, 153, 142, 0.6);
}

.activity-image-placeholder:hover {
  background: rgba(56, 239, 125, 0.1);
  border-color: rgba(56, 239, 125, 0.5);
}

.activity-image-placeholder span {
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}

/* 编辑模式 */
.activity-edit {
  padding: clamp(0.75rem, 1.5vw, 1rem);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
}

/* 一键沉浸模式按钮 */
.immersion-toggle {
  text-align: center;
  margin-top: clamp(2rem, 4vw, 3rem);
  padding: 0 clamp(1rem, 3vw, 2rem);
}

.immersion-btn {
  height: clamp(48px, 5vw, 56px);
  padding: 0 clamp(2rem, 4vw, 3rem);
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.9), rgba(17, 153, 142, 0.9));
  border: none;
  box-shadow: 0 8px 24px rgba(56, 239, 125, 0.3);
  transition: all 0.3s ease;
}

.immersion-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(56, 239, 125, 0.4);
}

.immersion-btn.immersion-active {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 152, 0, 0.9));
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
}

@keyframes rhythm-appear {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式：Journey Flow */
@media (max-width: 768px) {
  .activity-content {
    grid-template-columns: 1fr;
  }
  
  .activity-image-wrapper {
  width: 100%;
    height: 200px;
  }
  
  .period-header {
  flex-direction: column;
    align-items: flex-start;
  }
  
  /* 沉浸模式导航控件响应式 */
  .immersion-navigation {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-btn {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .period-indicator {
    width: 40px;
    height: 40px;
  }
  
  .indicator-icon {
    font-size: 1.125rem;
  }
  
  .period-indicators {
    order: 1;
    width: 100%;
    justify-content: center;
  }
  
  .nav-prev {
    order: 0;
  }
  
  .nav-next {
    order: 2;
  }
}

/* 💭 层4：共创空间（Creative Zone）样式 */
.creative-zone {
  position: relative;
  padding: clamp(2rem, 4vw, 3rem) 0;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(250, 250, 255, 0.3) 100%);
  border-radius: clamp(24px, 4vw, 32px);
}

.creation-section,
.material-section,
.moodboard-section {
  max-width: 1200px;
  margin: 0 auto clamp(2rem, 4vw, 3rem);
  padding: 0 clamp(1rem, 3vw, 2rem);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 clamp(1rem, 2vw, 1.5rem);
}

.title-icon {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  line-height: 1;
}

/* 灵感创作区 */
.inspiration-input-area {
  position: relative;
}

.inspiration-textarea {
  width: 100%;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.inspiration-textarea:focus-within {
  box-shadow: 0 0 0 2px rgba(56, 239, 125, 0.2);
}

.ai-generating-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(56, 239, 125, 0.1);
  border-radius: 12px;
  color: rgba(17, 153, 142, 0.8);
  font-size: 0.875rem;
}

.ai-feedback-card {
  margin-top: 1rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(56, 239, 125, 0.2);
  border-left: 4px solid rgba(56, 239, 125, 0.6);
  border-radius: 12px;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.75);
  animation: feedback-appear 0.5s ease-out;
}

@keyframes feedback-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 素材收集区 */
.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-action-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
}

.material-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: clamp(2rem, 4vw, 3rem);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 2px dashed rgba(56, 239, 125, 0.3);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.material-upload-zone:hover,
.material-upload-zone.drag-over {
  border-color: rgba(56, 239, 125, 0.6);
  background: rgba(56, 239, 125, 0.05);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: clamp(2rem, 4vw, 3rem);
  color: rgba(17, 153, 142, 0.6);
  margin-bottom: 0.75rem;
}

.upload-text {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: rgba(0, 0, 0, 0.7);
  margin: 0 0 0.5rem;
  font-weight: 500;
}

.upload-hint {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

.theme-selector {
  margin-left: auto;
}

/* 灵感拼图 */
.moodboard-section {
  position: relative;
}

.moodboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(150px, 18vw, 220px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  animation: moodboard-appear 0.6s ease-out;
}

.moodboard-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  animation: item-appear 0.4s ease-out;
  animation-delay: var(--delay);
  animation-fill-mode: both;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.moodboard-item:hover {
  transform: translateY(-4px) scale(1.02);
  z-index: 10;
}

.moodboard-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moodboard-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 70%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(1rem, 1.5vw, 1.25rem);
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(0px);
  z-index: 2;
}
.moodboard-item:hover .moodboard-overlay,
.moodboard-overlay.is-visible {
  opacity: 1;
  backdrop-filter: blur(8px);
}

.moodboard-overlay.has-poetry {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 75%);
}

.moodboard-poetry-content {
  width: 100%;
  margin-bottom: 0.75rem;
  z-index: 3;
}
/* 主提示语 - Apple Photos风格 */
.poetry-main-prompt {
  margin-bottom: 0.5rem;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.1s;
}

.moodboard-overlay.is-visible .poetry-main-prompt,
.moodboard-item:hover .poetry-main-prompt {
  opacity: 1;
  transform: translateY(0);
}
.moodboard-poetry-main {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', sans-serif;
  font-size: clamp(0.875rem, 1.3vw, 1rem);
  font-weight: 500;
  line-height: 1.6;
  color: rgba(249, 249, 249, 0.8);
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.01em;
  animation: poetryGlow 3s ease-in-out infinite;
}
/* 补充句 - 滑入 + 轻模糊背景 */
.poetry-extended-sentence {
  margin-top: 0.5rem;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.3s;
  position: relative;
}
.moodboard-overlay.is-visible .poetry-extended-sentence,
.moodboard-item:hover .poetry-extended-sentence {
  opacity: 1;
  transform: translateY(0);
}
.moodboard-poetry-extended {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', sans-serif;
  font-size: clamp(0.75rem, 1.15vw, 0.875rem);
  font-weight: 400;
  line-height: 1.6;
  color: rgba(249, 249, 249, 0.75);
  margin: 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.01em;
  font-style: italic;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  border-left: 2px solid rgba(56, 239, 125, 0.4);
}

/* 标签气泡 - 随滚动轻漂浮 */
.moodboard-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  z-index: 1;
}
.moodboard-tag-bubble {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  opacity: 0;
  transform: translateY(8px) scale(0.9);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--tag-delay, 0s);
  animation: tagFloat 4s ease-in-out infinite;
  animation-delay: var(--tag-delay, 0s);
  animation-fill-mode: both;
}

.moodboard-overlay.is-visible .moodboard-tag-bubble,
.moodboard-item:hover .moodboard-tag-bubble {
  opacity: 0.85;
  transform: translateY(0) scale(1);
}

.moodboard-item:hover .moodboard-tag-bubble {
  opacity: 1;
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(56, 239, 125, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tag-text {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', sans-serif;
  font-size: clamp(0.6875rem, 1vw, 0.75rem);
  font-weight: 500;
  color: rgba(249, 249, 249, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.02em;
}

.moodboard-poetry-placeholder {
  color: rgba(249, 249, 249, 0.7);
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  font-style: italic;
  text-align: center;
  padding: 0.5rem 0;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', sans-serif;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.moodboard-overlay.is-visible .moodboard-poetry-placeholder,
.moodboard-item:hover .moodboard-poetry-placeholder {
  opacity: 1;
}

/* 动效关键帧 */
@keyframes poetryGlow {
  0%, 100% {
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
  50% {
    text-shadow: 0 2px 12px rgba(56, 239, 125, 0.3), 0 2px 8px rgba(0, 0, 0, 0.5);
  }
}

@keyframes tagFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.02);
  }
}

.delete-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 77, 79, 0.9);
  color: white;
  border: none;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 1);
}

.moodboard-glow {
  position: absolute;
  inset: -2px;
  background: radial-gradient(circle, rgba(56, 239, 125, 0.3), transparent);
  border-radius: 18px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.moodboard-item:hover .moodboard-glow {
  opacity: 1;
}

.moodboard-item.user-upload {
  border: 2px solid rgba(56, 239, 125, 0.4);
}

/* 主题配色 */
.moodboard-grid.theme-cool-light .moodboard-item {
  filter: brightness(1.1) saturate(0.9);
}

.moodboard-grid.theme-warm-shadow .moodboard-item {
  filter: brightness(0.95) sepia(0.2);
}

@keyframes moodboard-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes item-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 🌌 层5：回声收尾（Echo Outro）样式 */
.echo-outro {
  position: relative;
  padding: clamp(3rem, 6vw, 5rem) 0;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  background: linear-gradient(180deg, rgba(250, 250, 255, 0.3) 0%, rgba(240, 240, 250, 0.5) 100%);
  border-radius: clamp(24px, 4vw, 32px);
  overflow: hidden;
}

.echo-outro::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at bottom, rgba(56, 239, 125, 0.1), transparent 70%);
  pointer-events: none;
}

/* 旅伴留言区 */
.companions-section {
  max-width: 1000px;
  margin: 0 auto clamp(2.5rem, 5vw, 4rem);
  padding: 0 clamp(1rem, 3vw, 2rem);
  position: relative;
  z-index: 2;
}

.companions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(200px, 25vw, 280px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
}

.companion-card {
  display: flex;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  padding: clamp(1rem, 2vw, 1.25rem);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: companion-appear 0.5s ease-out;
}

.companion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.companion-avatar {
  width: clamp(48px, 6vw, 64px);
  height: clamp(48px, 6vw, 64px);
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(56, 239, 125, 0.3);
}

.companion-info {
  flex: 1;
  min-width: 0;
}

.companion-name {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 0.25rem;
}

.companion-message {
  font-size: clamp(0.75rem, 1.3vw, 0.875rem);
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

@keyframes companion-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 行动按钮 */
.action-buttons {
  display: flex;
  gap: clamp(1rem, 2vw, 1.5rem);
  justify-content: center;
  max-width: 800px;
  margin: 0 auto clamp(2.5rem, 5vw, 4rem);
  padding: 0 clamp(1rem, 3vw, 2rem);
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
}

.extend-btn,
.convert-btn {
  flex: 1;
  min-width: 200px;
  height: clamp(48px, 5vw, 56px);
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  border-radius: 28px;
  transition: all 0.3s ease;
}

.extend-btn {
  background: linear-gradient(135deg, rgba(56, 239, 125, 0.9), rgba(17, 153, 142, 0.9));
  border: none;
  box-shadow: 0 8px 24px rgba(56, 239, 125, 0.3);
}

.extend-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(56, 239, 125, 0.4);
}

.convert-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(56, 239, 125, 0.3);
  color: rgba(17, 153, 142, 0.9);
}

.convert-btn:hover {
  border-color: rgba(56, 239, 125, 0.6);
  background: rgba(56, 239, 125, 0.05);
  transform: translateY(-2px);
}

/* 底部AI语句 */
.echo-statement {
  text-align: center;
  padding: 0 clamp(1rem, 3vw, 2rem);
  position: relative;
  z-index: 2;
}

.echo-text {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(17, 153, 142, 0.85);
  font-style: italic;
  line-height: 1.8;
  margin: 0;
  text-shadow: 0 2px 10px rgba(17, 153, 142, 0.2);
  animation: echo-fade-in 1s ease-out 0.3s both;
}

@keyframes echo-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式：Creative Zone & Echo Outro */
@media (max-width: 768px) {
  .moodboard-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  
  .companions-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .extend-btn,
  .convert-btn {
    width: 100%;
    min-width: unset;
  }
}

.modal-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 3rem;
  background: rgba(250, 250, 255, 0.5);
  border: 2px dashed rgba(56, 239, 125, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-upload-zone:hover,
.modal-upload-zone.drag-over {
  border-color: rgba(56, 239, 125, 0.6);
  background: rgba(56, 239, 125, 0.05);
}

.modal-upload-icon {
  font-size: 3rem;
  color: rgba(17, 153, 142, 0.6);
  margin-bottom: 1rem;
}

.modal-upload-text {
  font-size: 1.125rem;
  color: rgba(0, 0, 0, 0.7);
  margin: 0 0 0.5rem;
  font-weight: 500;
}

.modal-upload-hint {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* Unsplash搜索区域 */
.unsplash-search-section {
  min-height: 400px;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

.search-loading p {
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

.unsplash-results {
  margin-top: 1.5rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-count {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.unsplash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 0.5rem;
}

.unsplash-photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.unsplash-photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.unsplash-photo-item.selected {
  border-color: rgba(56, 239, 125, 0.8);
  box-shadow: 0 0 0 2px rgba(56, 239, 125, 0.2);
}

.unsplash-photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 50%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.unsplash-photo-item:hover .photo-overlay,
.unsplash-photo-item.selected .photo-overlay {
    opacity: 1;
}

.photo-info {
  color: white;
}

.photo-author {
  font-size: 0.75rem;
  margin: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.photo-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(56, 239, 125, 0.9);
  border-radius: 50%;
  color: white;
  align-self: flex-end;
}

.search-empty,
.search-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 0.5rem;
  color: rgba(0, 0, 0, 0.5);
}

.empty-icon,
.placeholder-icon {
  font-size: 3rem;
  color: rgba(17, 153, 142, 0.3);
  margin-bottom: 0.5rem;
}

.empty-hint,
.placeholder-hint {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.4);
}

.search-empty p,
.search-placeholder p {
  margin: 0;
  font-size: 1rem;
}
</style>

<style>
/* 全局样式 - 确保图片上传Modal在最上层 */
/* 使用更具体的选择器确保优先级 */
.ant-modal-wrap {
  z-index: 20000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.ant-modal-mask {
  z-index: 19999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.ant-modal {
  z-index: 20000 !important;
  position: fixed !important;
}

.ant-modal-content {
  position: relative !important;
  z-index: 20001 !important;
}

/* 当有模态框打开时，降低所有可能遮挡的元素 */
.experience-day.has-modal-open .bubble-expanded-card,
.experience-day.has-modal-open .journey-trail,
.experience-day.has-modal-open .mood-bubble {
  z-index: 1 !important;
  pointer-events: none !important;
  opacity: 0.3 !important;
}

/* 额外的全局覆盖 - 确保模态框始终在最上层 */
body .ant-modal-wrap {
  z-index: 20000 !important;
}

body .ant-modal-mask {
  z-index: 19999 !important;
}

body .ant-modal {
  z-index: 20000 !important;
}
</style>