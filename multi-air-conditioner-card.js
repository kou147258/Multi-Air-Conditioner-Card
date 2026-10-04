/**
 * Multi Air Conditioner Card
 * v1.10.0 Chinese/English edition — based on v1.9.2
 * HACS-compatible Web Component
 *
 * Modified fork. Original work and MIT licence:
 *   https://github.com/doanlong1412/Multi-Air-Conditioner-Card
 *   Copyright (c) 2024 doanlong1412
 * The MIT notice is reproduced in the LICENSE file at the root of this
 * repository, as the licence requires for any copy or substantial portion.
 *
 * ─── What's new in v1.10.0 ────────────────────────────────────────────────
 * 🎨 The two swing glyphs were redrawn, and the new ones report the louver
 *    instead of just looking decorative. Up/down used to be three horizontal
 *    waves -- which read as the LEFT/RIGHT control -- and left/right was a pair
 *    of chevrons with four accent ticks; both had to be decoded before they
 *    said anything. They are now arrows, and there are three states. The mode
 *    name already carries all three: pinned at an end draws a single arrow that
 *    way and sits still; pinned in between draws the double arrow and still
 *    sits still; sweeping draws the double arrow and moves. The axis picks the
 *    shape, the value picks the motion, and the two are independent.
 *
 *    The motion was the part that was wrong. The icon jiggled while the line
 *    under it read 固定, so the picture said "sweeping" about a louver that was
 *    parked; and a sweeping value ending in "upmost" sat frozen, saying "held"
 *    about louvers that were moving. The deciding word is the `fixed_` prefix,
 *    not a substring inside the value: swing_upmost is a range currently sitting
 *    at the top, not a louver pinned there.
 *
 *    Same 34x34 box on both sides (left/right came from 38x28, which
 *    letterboxed it smaller), same colour, same active and inactive opacity,
 *    same buttons, same labels, same layout; only the drawing changed.
 *
 * 🐛 The 左右扫风 button was reading the vertical swing state, so it lit up and
 *    animated whenever the UP/DOWN sweep was on, and stayed dead while the
 *    horizontal one was running. It now reads swing_horizontal_mode and has its
 *    own colour and opacity. The glyph helper was never at fault -- the two
 *    buttons were never asked about the right axis.
 * 🐛 Three controls were broken, each in its own way, and two of them did
 *    nothing at all. The Lite-view power button and the Super Lite room picker
 *    both read names that only exist inside the render methods -- `cfg` and
 *    `tr` -- so powering a stopped room ON issued zero service calls, and the
 *    room picker's throw landed after the transparent backdrop had already been
 *    appended, so every tap stranded another full-viewport layer that swallowed
 *    clicks. The dial drag guard tested only the Super Lite drag flag, so in
 *    Full/Lite a state change mid-gesture replaced the SVG the drag was bound
 *    to and the debounce committed a temperature the user never dragged to.
 * 🖱️ Hovering a mode button now affects that one button only. Two separate
 *    things were wrong: the row was dimmed to 0.65 as a whole, AND the hovered
 *    button was lifted without clearing the buttons the pointer had already
 *    crossed -- so sliding along the row stacked up to five lifted at once.
 *    The lift is smaller, and hovering the mode that is already running no
 *    longer swaps its gradient and glow for the plain hover background. The
 *    active dot and the running-state styling stay with the RUNNING mode.
 * 🔄 Only Auto and Cool turn their icon while they are the running mode. Heat,
 *    Dry and Fan sit still: the gradient, the border and the outer glow already
 *    mark the running mode, and five icons turning at once read as noise. Their
 *    glow still pulses -- that is the "this is what the AC is doing" signal -- and
 *    hovering any of the five still animates, because a pointer response is not
 *    a running state.
 * 🔁 setConfig now renders. A changed config used to sit in the model until some
 *    unrelated entity happened to change, and shrinking room_count rebuilt the
 *    room list while the old tabs stayed on screen -- tapping a leftover tab
 *    then threw and killed the card for the rest of the session.
 * 🔐 HTML escaping, for everything that can reach the markup: room names,
 *    owner_name, quick-switch labels, preset chips, room icons, damper names,
 *    room image URLs, and the fan/swing mode values the translation tables do
 *    not recognise (those are live entity attributes, not config). Room image
 *    URLs reject javascript:/vbscript:/file: and non-image data: schemes, and
 *    that check now strips control characters anywhere in the string, because
 *    the browser removes them before it resolves the scheme. Escaping happens at
 *    output rather than on the stored config, so owner_name and the damper
 *    names still round-trip through their text inputs unchanged.
 *    What this fixes in practice: a name containing a quote no longer truncates
 *    itself at the quote or breaks out of its own title="" attribute, and a
 *    name containing < no longer opens a tag. A plain & was never affected --
    browsers render a bare ampersand literally.
 * ✏️ Every option the visual editor offers now changes the card. Audited by
 *    rendering the card once per configuration and diffing the output:
 *      • The "Turn all off" text colour was written into a CSS variable that
 *        NOTHING read -- both rules hardcoded their colour, one of them with
 *        !important. It is wired up now.
 *      • The room-power and quick-switch entity pickers were never repopulated
 *        after an editor re-render, so dragging any display switch blanked
 *        those two boxes while the saved value kept working. Both now refill.
 *      • Two switches ("Power" and "Room power (Super Lite)") gated the same
 *        single row. One switch now, writing both keys so existing dashboards
 *        keep working.
 *      • The Sensors panel showed TWO pickers both labelled outdoor humidity and
 *        the lower one always lost silently. One field now; the old key is
 *        still read as a fallback.
 *      • "Humidity" actually gated the OUTDOOR pill only, and the kW/W
 *        selector looks inert for a sensor above 1000 W because acFmtPower
 *        promotes to kW in both modes. The labels now say so.
 *      • The current-temperature colour had no editor row although all 26 of
 *        its siblings did. Added.
 *    accent_color and text_color are NOT applied and no longer pretend to be:
 *    --accent carries the per-mode colours on purpose and nothing reads
 *    --text, so both keys were read into locals and discarded. They remain in
 *    the defaults so existing dashboards still load.
 * 🏠 Placeholder room names and icons are now defined for all eight rooms.
 *    With more than four, the old index wrap repeated the first names and
 *    rooms 5-8 fell through to the English defaults inside a Chinese card.
 * ⚡ The global power_entity field and the "Power (kW)" switch now do
 *    something: the Super Lite power row falls back to the global sensor when
 *    a room has none, and both switches gate that row. They were previously
 *    present in the editor and read nowhere else in the file.
 * 📡 Super Lite read only the legacy humidity key while every other view read
 *    the new name with the legacy one as a fallback, so filling in the editor's
 *    outdoor-humidity field gave a reading in two views and none in the third.
 * 🧹 Removed the dead dock-near1 / dock-near2 rules (JS never set those
 *    classes), an unread local in applyDock, a write-only powerVal preamble,
 *    and the three document listeners that Super Lite added on every re-render
 *    and only released when the element was removed.
 * ℹ️ The card now prints its version in the browser console on load.
 *
 * ─── What's new in v1.9.2 ─────────────────────────────────────────────────
 * 🌍 Language now follows Home Assistant — the visual editor has no picker.
 *    Simplified Chinese HA -> Chinese, English HA -> English, any other HA
 *    language -> English. A `language:` key left in an older dashboard config
 *    is ignored, so nothing has to be migrated by hand.
 *    Vietnamese is gone: it was never a real translation, only an alias of the
 *    Chinese table, so 'vi' would have silently rendered Chinese text.
 * 🧹 Removed dead Vietnamese code that no longer had any caller: GREET(),
 *    FAN_VI, SWING_VI, getTempComfort(), COMFORT. MODE_CFG.lbl now carries
 *    English fallbacks (every render site resolves labels via tr.modes first).
 * 🧩 Strings that were never wired to the i18n table are now translated:
 *    damper Close/Open preset buttons, the ETA estimate tooltip, the offline
 *    word, the damper count unit, and the placeholder room names.
 * 📝 All Vietnamese source comments were translated to English as well — the
 *    file now contains no Vietnamese at all, not even in comments.
 * 🧽 Removed the visual editor's author credit header, TikTok button and
 *    PayPal donate button, along with the now-unused .credit CSS rule. The
 *    first settings row inherits the top padding the header used to provide.
 *
 * ─── Upstream v1.9 ────────────────────────────────────────────────────────
 * 🏢 Central AC / Damper support — per-room toggle "Central AC"
 *    in the Visual Editor; add/remove cover damper entities with custom names;
 *    damper list appears below fan-speed panel when enabled;
 *    tap any damper button → glass popup with drag slider + 5 preset buttons
 *    (0 / 25 / 50 / 75 / 100%); calls cover.set_cover_position; live position
 *    bar updates from HA state; change detection for cover current_position
 *    added to set hass so card reacts instantly when dampers move
 * 🐛 Super Lite inner ring fix — inner arc (r=76) now tracks curTempC
 *    (actual room temperature) instead of setTempC, matching Full/Lite behaviour;
 *    dragging outer haptic ring no longer moves the inner ring
 * 🗑 Removed ▲ setTemp indicator inside dial center (Full/Lite)
 * Room tab → flashing red OFFLINE badge, sub-text "Offline" instead of temperature, icon dimmed, progress bar hidden
 * Temperature dial → displays --° and 📡 Offline instead of live temperature
 * STATUS block (right panel) → flashing red OFFLINE label + sub-text "Disconnected, waiting to restore..."
 * Power button → disabled, no HA service calls sent while entity is unavailable
 * Turn all off → automatically skips offline rooms, only turns off rooms that are currently on
 * Super Lite → header status badge and room dropdown both show OFFLINE
 * Auto-recovery → when the AC comes back online and its state changes, the card updates instantly without any reload
 * Applied consistently across all 3 view modes: Full / Lite / Super Lite
 * ─── What's new in v1.7.5 ─────────────────────────────────────────────────
 * 💾 Remember active room — the card stores the selected room in localStorage;
 *    after a page reload or a dashboard switch it returns to the last room
 *    the user picked (keyed per card, derived from its first entity)
 * 📡 Unavailable / Offline handling — when an AC loses the network or power
 *    (state = 'unavailable' / 'unknown') the card shows:
 *    • a flashing red "OFFLINE" badge on the affected room tab
 *    • "Offline" in place of the tab temperature
 *    • "--°" and "📡 Offline" on the temperature dial
 *    • "OFFLINE" + "Disconnected, waiting to restore..." in the right STATUS block
 *    • a disabled power button (no service calls while the entity is unavailable)
 *    • "Turn all off" automatically skips offline rooms
 *    • automatic recovery: when the AC reconnects and its state changes,
 *      the card updates itself
 *    Applied consistently across all 3 view modes: Full, Lite, Super Lite
 * 📐 Long-label overflow fix — fc-label (e.g. VENTILATORSNELHEID /
 *    LUCHTRICHTING) now wraps instead of spilling outside the card;
 *    letter-spacing reduced slightly; fan-card/swing-card get overflow:hidden;
 *    hdr-title, rt-header and sl-title are clamped with text-overflow:ellipsis
 * 🏢 System-aware Turn On — power on through climate.turn_on (an HA core
 *    service) instead of hardcoding set_hvac_mode:cool, so the integration /
 *    central system (Mitsubishi City Multi, etc.) picks the correct Heat/Cool
 *    mode; set_hvac_mode is only used when the user has already chosen a
 *    specific mode in the card
 * 🔧 Swing no-stuck fix — when the current swing_mode is not in the entity's
 *    supported swing_modes (idx = -1), cycling resets to the start of the list
 *    instead of getting stuck; applies to Full/Lite and Super Lite
 * 🔄 Smart power restore — "Tap to turn on" restores the remembered HVAC
 *    mode; stored in localStorage so it survives a page reload and other
 *    devices on the same domain; updated whenever the mode changes
 *    (heat/dry/fan/auto/cool/off)
 * 💨 Per-device fan filter — fan-card and Super Lite only show the levels the
 *    entity really supports (fan_modes attribute); devices with fewer levels
 *    never see inapplicable modes; the bar chart ratio and the blade count
 *    scale themselves to the number of real levels
 * 💨 Extended fan speed — added Low/Auto, High/Auto, Quiet alongside existing
 *    8 levels; entity-supported modes are shown automatically; fan SVG blade
 *    count & bar fill adapted; Quiet has slow-spin icon animation
 * 🔄 Auto HVAC mode — new Auto mode (Auto/Heat/Cool/Dry/Fan) with animated
 *    rotating icon (mdi:autorenew); hidden by default — enable via the
 *    "Auto mode" toggle in Display Options (same as other modes)
 * 🔢 Vertical airflow numeric positions — swing now supports positions 1–6
 *    for ACs that use numeric levels; if entity only reports off/vertical
 *    the card shows only those two options; numeric labels are localised
 * All three view modes (Full / Lite / Super Lite) updated consistently
 * 🐛 Scale flicker fix — debounced ResizeObserver + double-RAF + only set the
 *    style when the value really changes; dropped the CSS transition on
 *    transform to avoid a layout loop on mobile
 * 🐛 Tooltip flicker fix — the tooltip shows for 5s then hides itself
 *    (mobile); the timer is cleared/reset on a repeat tap; a double-RAF
 *    guarantees accurate positioning; the timer is cleaned up in
 *    disconnectedCallback to avoid a leak
 * 🎨 MDI room icons — all room icons now use mdi:* strings and render as native <ha-icon> elements throughout the card (tabs, popups, button labels); emoji still accepted as fallback; users can enter any MDI icon in the editor
 * 🐛 Fan blade fix — fixed an issue where the fan blade SVG would not render when the fan level index was ≥ 4 (Low-Mid and above), caused by an undersized blade-count array
 * ⚡ Per-room power sensor — each room has its own entities[n].power_entity; the displayed value updates automatically when switching rooms in all three view modes
 * 🔢 Power unit selector — choose kW or W in the editor; values ≥ 1000 W auto-convert to kW
 * 📍 Super Lite power indicator — power reading shown inline next to humidity in the header top-left; toggle with show_sl_room_power
 * 
 * ─── What's new in v1.4 ───────────────────────────────────────────────────────
 * ✨ Popup style option (Super Lite) — Normal (native select, iOS/Android consistent)
 *    vs Effect (custom glass popup with spring animation, same style as room picker)
 * ─── What's new in v1.2 ───────────────────────────────────────────────────────
 * 🌡️ Dynamic temperature colour on dial — blue (cold) → cyan → green → orange → red (hot)
 * ⏱️ Timer overhaul — 8 preset durations (30m · 1h · 1.5h · 2h · 3h · 4h · 6h · 8h) + free custom-minute input
 * 🔢 Room tabs enlarged — always shows 4 rooms, scrollable when more than 4
 * 🐛 Bug fixes and stability improvements
 * ─── What's new in v1.1 ───────────────────────────────────────────────────────
 *  🌐 Multi-language UI (historical — this build ships 中文 + English only)
 *  🎨 16 background gradient presets (same as Gate Card)
 *  🎛  Visual Editor identical to Gate Card: ha-entity-picker, accordion,
 *      color picker 3-layer, CSS-only toggle, bg preset grid
 *  🐛 Focus fix — text inputs no longer lose focus while typing
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── i18n ─────────────────────────────────────────────────────────────────────
const AC_TRANSLATIONS = {
  zh: {
    cardTitle: '多联机空调',
    cardSub:   '智能家居',
    greet: function() {
      var h = new Date().getHours();
      if (h>=6  && h<11) return '早上好，';
      if (h>=11 && h<13) return '中午好，';
      if (h>=13 && h<18) return '下午好，';
      if (h>=18 && h<21) return '晚上好，';
      return '晚安，';
    },
    tempLabel: '温度',
    selectRoom: '选择房间',
    modeLabel: '模式',
    statusLabel: '状态',
    statusOn: '运行中', statusOff: '已关闭',
    airGood: '空气质量良好', outdoorLabel: '室外', pressOn: '点击开机',
    dustLabel: 'PM2.5',
    fanLabel: '风速', swingLabel: '上下扫风',
    allOff: '全部关闭', allOffSub: '点击关闭所有房间',
    tapOff: '点击关闭', tapOn: '点击开启',
    confirmOff: '⚠ 全部关闭？', confirmSub: function(n) { return '将同时关闭 ' + n + ' 台空调'; },
    cancel: '取消', doOff: '⏻ 全部关闭',
    overlayOn: '开启', overlayOff: '关闭',
    modes: { cool:'制冷', heat:'制热', dry:'除湿', fan_only:'送风', auto:'自动', off:'关闭' },
    fans:   ['自动','最小','低','低中','中','中高','高','最大','低/自动','高/自动','静音'],
    swings: ['固定','上下','左右','全方位','位置1','位置2','位置3','位置4','位置5','位置6'],
    comfort: { dry:'干燥舒适', fan_only:'轻柔凉风', off:'已关闭' },
    comfortTemp: function(t) {
      t = Math.round(t);
      if (t<=19) return '好冷，多穿点！';
      if (t<=23) return '温度适宜，放松一下';
      if (t<=27) return '舒适惬意';
      if (t<=31) return '有点热，需要降温';
      return '太热了！请调节温度';
    },
    centralAcLabel: '🏢 中央空调', centralAcDesc: '启用以配置风阀 (damper)',
    damperAdd: '+ 添加风阀', damperRemove: '删除',
    damperEntity: '风阀实体 (cover.*)', damperName: '风阀名称',
    damperLabel: '风量',
    damperQuickClose: '✕ 关闭', damperQuickOpen: '✓ 打开',
    damperSummaryOpen: ' 个风阀开启 · 平均 ',
    damperCountUnit: ' 个风阀',
    etaTip: '按风速估算，有实测数据后会更准确',
    etaText: function(prefix, setTemp, sym, min) { return prefix + '预计 ' + min + ' 分钟内达到 ' + setTemp + sym; },
    offlineShort: '离线',
    offlineDevice: '设备离线',
    badgeOn: '开', badgeOff: '关', badgeOffline: '离线',
    // Value-keyed labels. Checked BEFORE the indexed table so vendor vocabulary
    // (Gree: 8 fan / 12 swing identifiers) stops leaking raw English.
    fanMap: {
      'auto': '自动', 'min': '最小', 'low': '低', 'low_mid': '中低', 'medium_low': '中低',
      'medium': '中', 'medium_high': '中高', 'high_mid': '中高', 'high': '高', 'max': '最大',
      'turbo': '强风', 'low/auto': '低/自动', 'high/auto': '高/自动', 'quiet': '静音',
    },
    hswingLabel: '左右扫风',
    hswingMap: {
      'default': '默认', 'swing_full': '左右扫风', 'both': '左右扫风',
      'fixed_leftmost': '固定最左', 'fixed_middle_left': '固定左中',
      'fixed_middle': '固定中间', 'fixed_middle_right': '固定右中',
      'fixed_rightmost': '固定最右', 'off': '关闭', 'vertical': '上下',
      '1': '位置1', '2': '位置2', '3': '位置3', '4': '位置4', '5': '位置5', '6': '位置6',
    },
    swingMap: {
      'off': '固定', 'vertical': '上下', 'horizontal': '左右', 'both': '全方位',
      'default': '默认', 'swing_full': '全域扫风',
      'fixed_upmost': '固定最上', 'fixed_middle_up': '固定中上', 'fixed_middle': '固定中间',
      'fixed_middle_low': '固定中下', 'fixed_lowest': '固定最下',
      'swing_downmost': '扫风最下', 'swing_middle_low': '扫风中下', 'swing_middle': '扫风中间',
      'swing_middle_up': '扫风中上', 'swing_upmost': '扫风最上',
      '1': '位置1', '2': '位置2', '3': '位置3', '4': '位置4', '5': '位置5', '6': '位置6',
    },
    presetEco: '节能', presetFav: '常用', presetClean: '自清洁',
    offlineTemp: '📡 离线',
    offlineWait: '设备离线，等待恢复...',
    tips: {
      hot:        function(t) { return '太热了 ' + t + '！快开空调！'; },
      warm:       function(t) { return '有点热了（' + t + '）— 要开空调吗？'; },
      cold:       function(t) { return '太冷了 ' + t + '！开制热？'; },
      humid:      function(h) { return '湿度 ' + h + '% — 太潮湿了，开除湿？'; },
      comfy:      function(t) { return t + ' - 房间舒适'; },
      coolHigh:   function(t) { return '正在制冷… ' + t + ' 还略高，稍等一下！'; },
      coolNice:   function(t) { return t + ' - 好凉快！'; },
      coolAlmost: function(t) { return '正在降温（' + t + '）— 快到了！'; },
      heating:    function(t) { return '正在升温（' + t + '）— 变暖和了！'; },
      dryingH:    function(h) { return '正在除湿，' + h + '% — 空气渐渐变干爽'; },
      drying:     function()    { return '正在除湿 — 空气舒服多了！'; },
      fan:        function(t) { return '风扇开启（' + t + '）— 只吹点风！'; },
      humidHigh:  function(h) { return ' (湿度 ' + h + '% 偏高！)'; },
      noTemp:     function()    { return '无温度数据'; },
    },
    comfortCoolingTo: function(s) { return '正在降温至 ' + s + '°'; },
    comfortHeatingTo: function(s) { return '正在升温至 ' + s + '°'; },
    comfortAtTarget: '温度已达标', comfortAuto: '自动调节中',
    qsAdd: '+ 添加快捷开关', qsEntity: '开关实体 (switch.*)', qsLabel: '名称（留空自动识别）',
    qsLabelPlaceholder: '省电', qsRemove: '删除', qsOn: '已开启', qsOff: '已关闭',
    edQuickSwitchesTitle: '快捷开关',
    edShowQuickSwitches: '快捷开关行', edShowQuickSwitchesDesc: '显示每台空调自带的省电/睡眠等功能开关',
    timerBtn: '定时',
    timerTitle: '⏰ 定时',
    timerOff: '⏹ 定时关闭', timerOn: '▶ 定时开启',
    timerMinPlaceholder: '输入分钟...', timerMinUnit: '分钟',
    timerDelete: '删除定时', timerConfirm: '确认',
    edViewMode: '🖥 显示模式',
    edViewModeFull: 'Full — 完整视图',
    edViewModeLite: 'Lite — 精简视图',
    edPopupStyle: '✨ 弹出样式 (Super Lite)',
    edPopupNormal: '普通',
    edPopupEffect: '特效',
    edPopupWave: '波浪',
    bgPresets: '预设',
    color1: '颜色 1 (左上)', color2: '颜色 2 (右下)',
    bgPresetNames: {"default":"默认","night":"夜间","sunset":"日落","forest":"森林","aurora":"极光","desert":"沙漠","ocean":"海洋","cherry":"樱粉","volcano":"火山","galaxy":"银河","ice":"冰蓝","olive":"橄榄","slate":"石板","rose":"玫瑰","teal":"青碧","deep_neon":"🔵 霓虹","custom":"✏ 自定义"},
    edOwnerName: '👤 显示名称 (智能家居)',
    edDisplay: '👁 显示选项',
    edShowGreet: '问候语', edShowGreetDesc: '显示早安/午安/晚安问候',
    edShowCool: '❄ 制冷模式', edShowHeat: '🔥 制热模式',
    edShowDry: '💧 除湿模式', edShowFanOnly: '🌀 送风模式', edShowAuto: '🔄 自动模式',
    edShowFan: '风速调节', edShowFanDesc: '显示风速调节面板',
    edShowSwing: '风向调节', edShowSwingDesc: '显示风向调节面板',
    edShowHswing: '左右扫风', edShowHswingDesc: '空调支持时显示左右扫风（自动检测）',
    edShowPreset: '快捷功能按钮', edShowPresetDesc: '最多三个按钮，可指向任意 switch / select / climate 实体。空调不支持预设时留空则不显示',
    edChipEntity: '按钮控制的实体 (switch.* / select.* / climate.*)',
    edChipOption: '选项 (select 用；climate 留空用预设名)',
    edChipLabel: '按钮文字 (留空用实体名)',
    edShowStatus: '状态面板', edShowStatusDesc: '显示右侧状态和传感器面板',
    edShowAllOff: '全部关闭按钮', edShowAllOffDesc: '显示全部关闭按钮',
    edShowTimer: '定时按钮', edShowTimerDesc: '显示定时按钮',
    edShowRoomEnv: '房间温湿度', edShowRoomEnvDesc: '显示选中房间的温湿度 (Super Lite)',
    edShowSlFan: '💨 风速 (Super Lite)', edShowSlFanDesc: '在 Super Lite 模式下显示风速按钮',
    edShowSlSwing: '🔄 风向 (Super Lite)', edShowSlSwingDesc: '在 Super Lite 模式下显示风向按钮',
    edDialInvert: '🔄 交换温度环', edDialInvertDesc: '设定温度在外环 (滑动操作)，室内温度在内环 — 默认',
    edPowerUnit: '⚡ 功率单位 (≥1000W 自动用 kW)', edPowerUnitKw: 'kW', edPowerUnitW: 'W',
    edTempUnit: '🌡 温度单位',
    edCoolAnimSpeed: '❄ 雪花重复间隔 (秒)', edCoolAnimSpeedDesc: '雪花动画之间的等待时间 (2–15秒)',
    edShowOutdoorTemp: '室外温度', edShowHumidity: '室外湿度', edShowPower: '功率', edShowPm25: 'PM2.5',
    edShowPowerDesc:    '仅 Super Lite：显示选中房间的用电量',
    edRoomCountLabel: function(n) { return '🏠 房间数量 (1–8，默认 4)'; },
    edRoomsHeader: function(n) { return '❄ 空调 (' + n + ' 个房间)'; },
    edRooms: '❄ 空调',
    edSensors: '📡 环境传感器',
    edBg: '背景',
    edBgAlpha: '🔆 背景透明度', edBgTransparent: '透明', edBgSolid: '实心',
    edColorsAdvanced: '🎨 高级颜色',
    edColorsDefault: '留空 = 使用默认颜色。实时应用。',
    edColorsReset: '↩ 重置所有颜色为默认',
    edColorsSecHeader: '📌 标题和问候语',
    edColorsDial: '🌡 温度刻度盘',
    edColorsModeCtrl: '⚡ 模式和控制',
    edColorsStatusRoom: '🏠 状态和房间标签',
    colorLabels: {
      color_title:       '📌 标题文字 (AIRCONDITIONING)',
      color_greet_sub:   '🌅 问候语文字 (早上好...)',
      color_greet_name:  '🏷 Smart Home 名称',
      color_dial_lbl:    '🔠 温度文字 (温度 / TEMPERATURE)',
      color_temp_val:    '🌡 当前温度数字',
      color_comfort:     '💬 体感文字 (好凉快...)',
      color_temp_set:    '🎯 设定温度数字 (19.5°C)',
      color_eta:         '⏱ 预计降温时间',
      color_dial_arc:    '〰 温度圆环',
      color_mode_lbl:    '🔵 模式名称文字',
      color_mode_active: '✅ 当前启用的模式按钮',
      color_fc_label:    '💨 风速/风向标题文字',
      color_fc_val:      '💨 风速档位值 (自动...)',
      color_swing_lbl:   '🔄 风向文字 (固定/上下...)',
      color_power_lbl:   '⏻ 开 / 关文字',
      color_timer_lbl:   '⏰ 定时文字',
      color_alloff_lbl:  '🔴 全部关闭文字',
      color_st_title:    '📊 状态标题文字',
      color_status_on:   '🟢 运行中文字',
      color_status_off:  '⚫ 已关闭文字',
      color_st_sub:      '💬 状态副文字',
      color_room_header: '🏠 选择房间文字',
      color_room_name:   '🏷 房间标签名称',
      color_room_on:     '🟩 房间开启徽标',
      color_room_off:    '⬜ 房间关闭徽标',
      color_fan_bar:     '📊 风速条',
    },
    edAcEntity: '❄ 空调实体 (climate.*)',
    edRoomTempEntity: '🌡 房间温度传感器 (如果空调没有)',
    edRoomHumidityEntity: '💧 房间湿度传感器 (如果空调没有)',
    edRoomPowerEntity: '⚡ 房间用电传感器 (sensor.*)',
    edChipsHeader: '⌘ 快捷功能按钮',
    edAcName: '🏷 显示名称',
    edAcIcon: '🎨 MDI 图标 (例如: mdi:sofa)',
    edAcImage: '🖼 房间图片 (URL)',
    edImagePlaceholder: 'https://... 或 /local/...',
    edDamperIndex: '风阀 ',
    edDamperNamePlaceholder: '客厅...',
    edPm25: '🌫 PM2.5',
    edOutdoorHumidity: '💧 室外湿度传感器',
    groupQuickSwitches: '功能开关', groupPresets: '预设',
    sensRowDesc: '把室外温度和室外湿度显示成一颗药丸；PM2.5 单独显示在状态旁边的圆环里',
    edOutdoorTemp: '🌡 室外温度',
    edHumidity: '💧 室外湿度',
    edPower: '⚡ 用电量 (kW)',
    // Eight entries, not four: room_count goes to eight and the resolver indexes
    // by position, so a shorter table left rooms 5-8 showing the English defaults
    // from ROOMS_DEFAULT inside an otherwise Chinese card.
    rooms: ['客厅','卧室','餐厅','书房','浴室','儿童房','健身房','储物间'],
    roomIcons: ['mdi:sofa','mdi:bed','mdi:silverware-fork-knife','mdi:briefcase','mdi:shower','mdi:teddy-bear','mdi:dumbbell','mdi:archive'],
  },
  en: {
    cardTitle: 'Multi-split AC',
    cardSub:   'Smart Home',
    greet: function() {
      var h = new Date().getHours();
      if (h>=6  && h<11) return 'Good morning, ';
      if (h>=11 && h<13) return 'Good noon, ';
      if (h>=13 && h<18) return 'Good afternoon, ';
      if (h>=18 && h<21) return 'Good evening, ';
      return 'Good night, ';
    },
    tempLabel: 'Temp',
    selectRoom: 'Select room',
    modeLabel: 'Mode',
    statusLabel: 'Status',
    statusOn: 'Running', statusOff: 'Off',
    airGood: 'Air quality good', outdoorLabel: 'Outdoor', pressOn: 'Tap to turn on',
    dustLabel: 'PM2.5',
    fanLabel: 'Fan', swingLabel: 'Up-down',
    allOff: 'Turn all off', allOffSub: 'Tap to turn off every room',
    tapOff: 'Tap to turn off', tapOn: 'Tap to turn on',
    confirmOff: '⚠ Turn all off?', confirmSub: function(n) { return 'Will turn off ' + n + ' AC unit(s)'; },
    cancel: 'Cancel', doOff: '⏻ Turn all off',
    overlayOn: 'On', overlayOff: 'Off',
    modes: { cool:'Cool', heat:'Heat', dry:'Dry', fan_only:'Fan', auto:'Auto', off:'Off' },
    fans:   ['Auto','Min','Low','Low-Mid','Medium','High-Mid','High','Max','Low/Auto','High/Auto','Quiet'],
    swings: ['Fixed','Up/Down','Left/Right','Full','Position 1','Position 2','Position 3','Position 4','Position 5','Position 6'],
    comfort: { dry:'Dry comfort', fan_only:'Gentle breeze', off:'Off' },
    comfortTemp: function(t) {
      t = Math.round(t);
      if (t<=19) return 'Too cold — wear more!';
      if (t<=23) return 'Nice temperature, time to relax';
      if (t<=27) return 'Comfortable';
      if (t<=31) return 'A bit warm — time to cool down';
      return 'Too hot! Please adjust the temperature';
    },
    centralAcLabel: '🏢 Central AC', centralAcDesc: 'Enable to configure dampers',
    damperAdd: '+ Add damper', damperRemove: 'Remove',
    damperEntity: 'Damper entity (cover.*)', damperName: 'Damper name',
    damperLabel: 'Airflow',
    damperQuickClose: '✕ Close', damperQuickOpen: '✓ Open',
    damperSummaryOpen: ' open · avg ',
    damperCountUnit: ' dampers',
    etaTip: 'Estimated from fan speed — becomes more accurate with real data',
    etaText: function(prefix, setTemp, sym, min) { return prefix + 'Est. ' + setTemp + sym + ' in ' + min + ' min'; },
    offlineShort: 'Offline',
    offlineDevice: 'Device offline',
    badgeOn: 'ON', badgeOff: 'OFF', badgeOffline: 'OFFLINE',
    fanMap: {
      'auto': 'Auto', 'min': 'Min', 'low': 'Low', 'low_mid': 'Low-Mid', 'medium_low': 'Low-Mid',
      'medium': 'Medium', 'medium_high': 'High-Mid', 'high_mid': 'High-Mid', 'high': 'High', 'max': 'Max',
      'turbo': 'Turbo', 'low/auto': 'Low/Auto', 'high/auto': 'High/Auto', 'quiet': 'Quiet',
    },
    hswingLabel: 'Left-right',
    hswingMap: {
      'default': 'Default', 'swing_full': 'Left-right sweep', 'both': 'Left-right sweep',
      'fixed_leftmost': 'Fixed far left', 'fixed_middle_left': 'Fixed left-mid',
      'fixed_middle': 'Fixed middle', 'fixed_middle_right': 'Fixed right-mid',
      'fixed_rightmost': 'Fixed far right', 'off': 'Off', 'vertical': 'Up/Down',
      '1': 'Position 1', '2': 'Position 2', '3': 'Position 3', '4': 'Position 4', '5': 'Position 5', '6': 'Position 6',
    },
    swingMap: {
      'off': 'Fixed', 'vertical': 'Up/Down', 'horizontal': 'Left/Right', 'both': 'Full',
      'default': 'Default', 'swing_full': 'Full sweep',
      'fixed_upmost': 'Fixed top', 'fixed_middle_up': 'Fixed upper-mid',
      'fixed_middle': 'Fixed middle', 'fixed_middle_low': 'Fixed lower-mid', 'fixed_lowest': 'Fixed bottom',
      'swing_downmost': 'Sweep bottom', 'swing_middle_low': 'Sweep lower-mid', 'swing_middle': 'Sweep middle',
      'swing_middle_up': 'Sweep upper-mid', 'swing_upmost': 'Sweep top',
      '1': 'Position 1', '2': 'Position 2', '3': 'Position 3', '4': 'Position 4', '5': 'Position 5', '6': 'Position 6',
    },
    presetEco: 'Eco', presetFav: 'Fav', presetClean: 'Clean',
    offlineTemp: '📡 Offline',
    offlineWait: 'Device offline, waiting to restore...',
    tips: {
      hot:        function(t) { return 'Too hot at ' + t + '! Turn on the AC!'; },
      warm:       function(t) { return 'A bit warm (' + t + ') — turn on AC?'; },
      cold:       function(t) { return 'Too cold at ' + t + '! Turn on heat?'; },
      humid:      function(h) { return h + '% humidity — quite humid! Try dry mode?'; },
      comfy:      function(t) { return t + ' - room is comfortable'; },
      coolHigh:   function(t) { return 'Cooling… ' + t + ' is still a bit high, hang on!'; },
      coolNice:   function(t) { return t + ' - nice and cool!'; },
      coolAlmost: function(t) { return 'Cooling down (' + t + ') — almost there!'; },
      heating:    function(t) { return 'Heating up (' + t + ') — getting warm!'; },
      dryingH:    function(h) { return 'Drying… ' + h + '% humidity — getting better!'; },
      drying:     function()    { return 'Dehumidifying — air feels fresher!'; },
      fan:        function(t) { return 'Fan on (' + t + ') — just fresh air!'; },
      humidHigh:  function(h) { return ' (humidity ' + h + '% is high!)'; },
      noTemp:     function()    { return 'No temperature data'; },
    },
    comfortCoolingTo: function(s) { return 'Cooling to ' + s + '°'; },
    comfortHeatingTo: function(s) { return 'Heating to ' + s + '°'; },
    comfortAtTarget: 'Target reached', comfortAuto: 'Auto adjusting',
    qsAdd: '+ Add quick switch', qsEntity: 'Switch entity (switch.*)', qsLabel: 'Label (auto if blank)',
    qsLabelPlaceholder: 'Power save', qsRemove: 'Remove', qsOn: 'On', qsOff: 'Off',
    edQuickSwitchesTitle: 'Quick switches',
    edShowQuickSwitches: 'Quick switch row', edShowQuickSwitchesDesc: 'Show the feature switches the A/C exposes (power save, sleep, ...)',
    timerBtn: 'Timer',
    timerTitle: '⏰ Timer',
    timerOff: '⏹ Off timer', timerOn: '▶ On timer',
    timerMinPlaceholder: 'Enter minutes...', timerMinUnit: 'min',
    timerDelete: 'Delete timer', timerConfirm: 'Confirm',
    edViewMode: '🖥 View mode',
    edViewModeFull: 'Full — full view',
    edViewModeLite: 'Lite — compact view',
    edPopupStyle: '✨ Popup style (Super Lite)',
    edPopupNormal: 'Normal',
    edPopupEffect: 'Effect',
    edPopupWave: 'Wave',
    bgPresets: 'Presets',
    color1: 'Color 1 (top-left)', color2: 'Color 2 (bottom-right)',
    bgPresetNames: {"default":"Default","night":"Night","sunset":"Sunset","forest":"Forest","aurora":"Aurora","desert":"Desert","ocean":"Ocean","cherry":"Cherry","volcano":"Volcano","galaxy":"Galaxy","ice":"Ice","olive":"Olive","slate":"Slate","rose":"Rose","teal":"Teal","deep_neon":"🔵 Deep Neon","custom":"✏ Custom"},
    edOwnerName: '👤 Display name (Smart Home)',
    edDisplay: '👁 Display options',
    edShowGreet: 'Greeting', edShowGreetDesc: 'Show the good morning/afternoon/evening greeting',
    edShowCool: '❄ Cool mode', edShowHeat: '🔥 Heat mode',
    edShowDry: '💧 Dry mode', edShowFanOnly: '🌀 Fan mode', edShowAuto: '🔄 Auto mode',
    edShowFan: 'Fan control', edShowFanDesc: 'Show the fan speed panel',
    edShowSwing: 'Swing control', edShowSwingDesc: 'Show the swing direction panel',
    edShowHswing: 'Left-right swing', edShowHswingDesc: 'Show horizontal swing when the unit supports it (auto-detected)',
    edShowPreset: 'Quick action chips', edShowPresetDesc: 'Up to three buttons pointing at any switch / select / climate entity. Left empty they hide when the unit has no presets',
    edChipEntity: 'Entity the button controls (switch.* / select.* / climate.*)',
    edChipOption: 'Option (for select; for climate leave empty to use the preset name)',
    edChipLabel: 'Button text (blank = entity name)',
    edShowStatus: 'Status panel', edShowStatusDesc: 'Show the status and sensor panel on the right',
    edShowAllOff: 'Turn all off button', edShowAllOffDesc: 'Show the turn-all-off button',
    edShowTimer: 'Timer button', edShowTimerDesc: 'Show the timer button',
    edShowRoomEnv: 'Room temp & humidity', edShowRoomEnvDesc: 'Show the selected room temp/humidity (Super Lite)',
    edShowSlFan: '💨 Fan (Super Lite)', edShowSlFanDesc: 'Show the fan button in Super Lite mode',
    edShowSlSwing: '🔄 Swing (Super Lite)', edShowSlSwingDesc: 'Show the swing button in Super Lite mode',
    edDialInvert: '🔄 Swap temp rings', edDialInvertDesc: 'Set temp on the outer ring (draggable), room temp on the inner ring — default',
    edPowerUnit: '⚡ Power unit (auto kW at 1000 W and above)', edPowerUnitKw: 'kW', edPowerUnitW: 'W',
    edTempUnit: '🌡 Temperature unit',
    edCoolAnimSpeed: '❄ Snowflake repeat interval (s)', edCoolAnimSpeedDesc: 'Wait time between snowflake animations (2–15 s)',
    edShowOutdoorTemp: 'Outdoor temp', edShowHumidity: 'Outdoor humidity', edShowPower: 'Power', edShowPm25: 'PM2.5',
    edShowPowerDesc:    'Super Lite only: shows the selected room\'s power draw',
    edRoomCountLabel: function(n) { return '🏠 Room count (1–8, default 4)'; },
    edRoomsHeader: function(n) { return '❄ AC units (' + n + ' rooms)'; },
    edRooms: '❄ AC units',
    edSensors: '📡 Environment sensors',
    edBg: 'Background',
    edBgAlpha: '🔆 Background opacity', edBgTransparent: 'Transparent', edBgSolid: 'Solid',
    edColorsAdvanced: '🎨 Advanced colors',
    edColorsDefault: 'Leave empty = use the default. Applies live.',
    edColorsReset: '↩ Reset all colors to default',
    edColorsSecHeader: '📌 Title and greeting',
    edColorsDial: '🌡 Temperature dial',
    edColorsModeCtrl: '⚡ Mode and controls',
    edColorsStatusRoom: '🏠 Status and room tabs',
    colorLabels: {
      color_title:       '📌 Title text (AIRCONDITIONING)',
      color_greet_sub:   '🌅 Greeting text (Good morning...)',
      color_greet_name:  '🏷 Smart Home name',
      color_dial_lbl:    '🔠 Temperature label (TEMPERATURE)',
      color_temp_val:    '🌡 Current temperature number',
      color_comfort:     '💬 Comfort text (nice and cool...)',
      color_temp_set:    '🎯 Set temperature value (19.5°C)',
      color_eta:         '⏱ Estimated cooling time',
      color_dial_arc:    '〰 Temperature arc',
      color_mode_lbl:    '🔵 Mode name text',
      color_mode_active: '✅ Active mode button',
      color_fc_label:    '💨 Fan / swing heading text',
      color_fc_val:      '💨 Fan speed value (Auto...)',
      color_swing_lbl:   '🔄 Swing text (Fixed / Up-Down...)',
      color_power_lbl:   '⏻ On / off text',
      color_timer_lbl:   '⏰ Timer text',
      color_alloff_lbl:  '🔴 "Turn all off" text',
      color_st_title:    '📊 Status heading text',
      color_status_on:   '🟢 "Running" text',
      color_status_off:  '⚫ "Off" text',
      color_st_sub:      '💬 Status sub text',
      color_room_header: '🏠 "Select room" text',
      color_room_name:   '🏷 Room name in tab',
      color_room_on:     '🟩 Room ON badge',
      color_room_off:    '⬜ Room OFF badge',
      color_fan_bar:     '📊 Fan speed bar',
    },
    edAcEntity: '❄ AC entity (climate.*)',
    edRoomTempEntity: '🌡 Room temperature sensor (if the AC has none)',
    edRoomHumidityEntity: '💧 Room humidity sensor (if the AC has none)',
    edRoomPowerEntity: '⚡ Room power sensor (sensor.*)',
    edChipsHeader: '⌘ Quick action chips',
    edAcName: '🏷 Display name',
    edAcIcon: '🎨 MDI icon (e.g. mdi:sofa)',
    edAcImage: '🖼 Room image (URL)',
    edImagePlaceholder: 'https://... or /local/...',
    edDamperIndex: 'Damper ',
    edDamperNamePlaceholder: 'Living room...',
    edPm25: '🌫 PM2.5',
    edOutdoorHumidity: '💧 Outdoor humidity sensor',
    groupQuickSwitches: 'Feature switches', groupPresets: 'Presets',
    sensRowDesc: 'Show the outdoor temperature and humidity as two pills; PM2.5 is shown on its own ring beside the status',
    edOutdoorTemp: '🌡 Outdoor temp',
    edHumidity: '💧 Outdoor humidity',
    edPower: '⚡ Power (kW)',
    rooms: ['Living room','Bedroom','Dining room','Study','Bathroom','Kids room','Gym','Utility'],
    roomIcons: ['mdi:sofa','mdi:bed','mdi:silverware-fork-knife','mdi:briefcase','mdi:shower','mdi:teddy-bear','mdi:dumbbell','mdi:archive'],
  },
};
// ─── Language follows Home Assistant ─────────────────────────────────────────
// The card ships 中文 + English and offers no picker: it reads the HA frontend
// language. Simplified Chinese -> zh, everything else -> English. Falling back
// to English (not Chinese) is deliberate: a user on an unsupported language gets
// a readable UI instead of Simplified text they may not read.
// Vietnamese is gone for good -- it was never a real translation, just an alias
// of the Chinese table, so 'vi' would have silently rendered Chinese.
// Traditional Chinese (zh-TW / zh-HK / zh-Hant) is treated as "other" -> English.
const AC_ZH_LANG_CODES = ['zh', 'zh-cn', 'zh-sg', 'zh-my', 'zh-hans', 'zh-hans-cn'];
function acLangFromHass(hass) {
  var code = (hass && (hass.language || (hass.locale && hass.locale.language))) || '';
  code = String(code).toLowerCase().replace(/_/g, '-');
  if (!code) return 'en';
  return AC_ZH_LANG_CODES.indexOf(code) >= 0 ? 'zh' : 'en';
}
const AC_BG_PRESETS = [
  { id: 'default', label: 'Default',  c1: '#001e2b', c2: '#12c6f3' },
  { id: 'night',   label: 'Night',    c1: '#0d0d1a', c2: '#1a0a3a' },
  { id: 'sunset',  label: 'Sunset',   c1: '#1a0a00', c2: '#ff6b35' },
  { id: 'forest',  label: 'Forest',   c1: '#0a1a0a', c2: '#1a5c1a' },
  { id: 'aurora',  label: 'Aurora',   c1: '#0a0a1a', c2: '#00cc88' },
  { id: 'desert',  label: 'Desert',   c1: '#1a0e00', c2: '#c8860a' },
  { id: 'ocean',   label: 'Ocean',    c1: '#001020', c2: '#0055aa' },
  { id: 'cherry',  label: 'Cherry',   c1: '#1a0010', c2: '#cc2255' },
  { id: 'volcano', label: 'Volcano',  c1: '#1a0500', c2: '#dd3300' },
  { id: 'galaxy',  label: 'Galaxy',   c1: '#080818', c2: '#6633cc' },
  { id: 'ice',     label: 'Ice',      c1: '#0a1828', c2: '#88ddff' },
  { id: 'olive',   label: 'Olive',    c1: '#0e1200', c2: '#7a9a00' },
  { id: 'slate',   label: 'Slate',    c1: '#101820', c2: '#445566' },
  { id: 'rose',    label: 'Rose',     c1: '#1a0808', c2: '#ee6688' },
  { id: 'teal',    label: 'Teal',     c1: '#001818', c2: '#00aa88' },
  { id: 'deep_neon', label: '🔵 Deep Neon', c1: '#020b18', c2: '#00d4ff' },
  { id: 'custom',  label: '✏ Custom', c1: null,      c2: null       },
];

function acPresetGradient(preset, c1, c2, bgAlpha) {
  // bgAlpha: 0-100 (%), controls the background opacity
  // Convert % into two hex alpha values: start = alpha, end = alpha/3 (for the gradient fade)
  var alphaPct = (bgAlpha !== undefined && bgAlpha !== null) ? Math.max(0, Math.min(100, parseInt(bgAlpha))) : 80;
  var alphaHex = Math.round(alphaPct * 2.55).toString(16).padStart(2,'0');
  var alphaHex2 = Math.round(alphaPct * 2.55 / 3).toString(16).padStart(2,'0');
  if (preset === 'deep_neon') {
    // deep_neon: apply the alpha via an rgba overlay
    if (alphaPct < 100) {
      var a = (alphaPct / 100).toFixed(2);
      return 'linear-gradient(160deg, rgba(2,11,24,' + a + ') 0%, rgba(4,20,40,' + a + ') 30%, rgba(6,28,53,' + a + ') 60%, rgba(3,14,31,' + a + ') 100%)';
    }
    return 'linear-gradient(160deg, #020b18 0%, #041428 30%, #061c35 60%, #030e1f 100%)';
  }
  const p = AC_BG_PRESETS.find(x => x.id === preset) || AC_BG_PRESETS[0];
  const gc1 = (preset === 'custom' ? c1 : p.c1) || '#001e2b';
  const gc2 = (preset === 'custom' ? c2 : p.c2) || '#12c6f3';
  return 'linear-gradient(135deg, ' + gc1 + alphaHex + ' 0%, ' + gc2 + alphaHex2 + ' 100%)';
}

// ─── Temperature color: 10°C=blue → 22°C=cyan → 26°C=green → 30°C=orange → 35°C=red ──
function acTempColor(temp) {
  var t = Math.max(10, Math.min(35, temp));
  var stops = [
    { t: 10,  r: 59,  g: 130, b: 246 }, // blue
    { t: 18,  r: 34,  g: 211, b: 238 }, // cyan
    { t: 24,  r: 52,  g: 211, b: 153 }, // green
    { t: 28,  r: 251, g: 191, b: 36  }, // amber
    { t: 31,  r: 249, g: 115, b: 22  }, // orange
    { t: 35,  r: 239, g: 68,  b: 68  }, // red
  ];
  var lo = stops[0], hi = stops[stops.length - 1];
  for (var i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i+1].t) { lo = stops[i]; hi = stops[i+1]; break; }
  }
  var f = lo.t === hi.t ? 0 : (t - lo.t) / (hi.t - lo.t);
  var r = Math.round(lo.r + (hi.r - lo.r) * f);
  var g = Math.round(lo.g + (hi.g - lo.g) * f);
  var b = Math.round(lo.b + (hi.b - lo.b) * f);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

const AC_DEFAULT_CONFIG = {
  // Overwritten from hass.language on the first set hass. 'en' is the stated
  // fallback for "HA language is neither Simplified Chinese nor English".
  language: 'en',
  background_preset: 'default',
  bg_color1: '#001e2b',
  bg_color2: '#12c6f3',
  accent_color: '#00ffcc',
  text_color: '#ffffff',
  room_count: 4,
  popup_style: 'normal',
  bg_alpha: 80,
  color_temp_val: '',
  color_comfort: '',
  color_mode_active: '',
  color_room_on: '',
  color_room_off: '',
  color_status_on: '',
  color_status_off: '',
  color_fan_bar: '',
  color_dial_arc: '',
  color_title: '',
  color_greet_sub: '',
  color_greet_name: '',
  color_dial_lbl: '',
  color_temp_set: '',
  color_eta: '',
  color_mode_lbl: '',
  color_fc_label: '',
  color_fc_val: '',
  color_swing_lbl: '',
  color_power_lbl: '',
  color_timer_lbl: '',
  color_alloff_lbl: '',
  color_room_header: '',
  color_room_name: '',
  color_st_title: '',
  color_st_sub: '',
  temp_unit: 'C',
};

// ─── Comfort text ──────────────────────────────────────────────────────────
// While the unit is running, an action reads better than a temperature band:
// "Cooling to 16 degC" says what the AC is doing, whereas "comfortable" at
// 24 degC while it is cooling to 16 degC reads as a contradiction. When it is
// off, the pure temperature band is the right thing to show.
function acComfortText(tr, hvac, curC, setC) {
  var h = hvac || 'off';
  // Off: show the temperature band. "已关闭" is already on the power button
  // and in the status block, so repeating it here wastes the one line that
  // can still say something useful.
  if (h === 'off')   return tr.comfortTemp ? tr.comfortTemp(curC) : '';
  if (h === 'cool')  return (curC - setC) > 0.5  ? tr.comfortCoolingTo(setC) : tr.comfortAtTarget;
  if (h === 'heat')  return (setC - curC) > 0.5  ? tr.comfortHeatingTo(setC) : tr.comfortAtTarget;
  if (h === 'dry')   return (tr.comfort && tr.comfort.dry) || '';
  if (h === 'fan_only') return (tr.comfort && tr.comfort.fan_only) || '';
  if (h === 'auto')  return tr.comfortAuto || tr.comfortTemp(curC);
  return tr.comfortTemp ? tr.comfortTemp(curC) : '';
}

// ─── Quick switch presets ──────────────────────────────────────────────────
// Integrations that split A/C features out into switch.* entities. Matched on
// the SUFFIX of the entity_id, so `switch.gree_dc95_power_save` and
// `switch.midea_2_sleep` both resolve without any extra config.
const AC_SWITCH_PRESETS = {
  'power_save':       { zh: '省电',     en: 'Power save', icon: 'mdi:leaf' },
  'sleep':            { zh: '睡眠',     en: 'Sleep',     icon: 'mdi:sleep' },
  'anti_direct_blow': { zh: '防直吹',   en: 'No draft',  icon: 'mdi:account-arrow-right' },
  '8degc_heat':       { zh: '8℃制热',  en: '8 degC',    icon: 'mdi:snowflake-thermometer' },
  'lights':           { zh: '面板灯',   en: 'Panel',     icon: 'mdi:lightbulb' },
  'auto_light':       { zh: '自动灯',   en: 'Auto light',icon: 'mdi:lightbulb-on' },
  'light_sensor':     { zh: '光线感应', en: 'Light sens',icon: 'mdi:brightness-5' },
  'x_fan':            { zh: '导风板',   en: 'Vane',      icon: 'mdi:arrow-left-right' },
  'auto_x_fan':       { zh: '自动导风', en: 'Auto vane', icon: 'mdi:arrow-left-right' },
  'health':           { zh: '健康',     en: 'Health',    icon: 'mdi:shield-sun' },
  'beeper':           { zh: '提示音',   en: 'Beep',      icon: 'mdi:volume-high' },
};

// normalise one entry to {entity_id, label, icon}
function acQuickSwitch(tr, entry, lang) {
  if (!entry) return null;
  var o = (typeof entry === 'string') ? { entity_id: entry } : entry;
  var id = o.entity_id || o.switch || o.id;
  if (!id) return null;
  var objectId = String(id).split('.').pop().toLowerCase();
  // Integrations put the feature LAST but prefix it with the model:
  // switch.gree_dc95_power_save -> gree_dc95_power_save -> dc95_power_save ->
  // power_save. Try the longest suffix first so a more specific key wins.
  var parts = objectId.split('_');
  var preset = null, matched = null;
  for (var k = 0; k < parts.length; k++) {
    var cand = parts.slice(k).join('_');
    if (AC_SWITCH_PRESETS[cand]) { preset = AC_SWITCH_PRESETS[cand]; matched = cand; break; }
  }
  // Unrecognised switch: fall back to the full object id. It is the only text
  // guaranteed to identify which entity the button refers to; chopping it to
  // the last segment yields meaningless words like "thing".
  return {
    entity_id: id,
    // `lang` is the resolved code from acLangFromHass(), so it is always
    // exactly 'en' or 'zh' -- never a display name.
    label: o.label || (preset ? preset[lang === 'en' ? 'en' : 'zh'] : objectId),
    icon: o.icon || (preset ? preset.icon : 'mdi:toggle-switch'),
  };
}

function acQuickSwitchesFor(tr, roomCfg, lang) {
  var list = (roomCfg && roomCfg.quick_switches) || [];
  if (!Array.isArray(list)) return [];
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var q = acQuickSwitch(tr, list[i], lang || 'zh');
    if (q) out.push(q);
  }
  return out;
}

// ─── Device reading validation ──────────────────────────────────────────────
// A sensor is usable only when it EXISTS and yields a finite number.
// 'unavailable' / 'unknown' / '' all slip past a bare parseFloat, and an
// integration that is not really reporting often sits at exactly 0 — which
// renders as a confident but false "0%". Returning null lets callers drop the
// cell instead of showing a placeholder or a lie.
function acSensorNum(stateObj) {
  if (!stateObj) return null;
  var s = String(stateObj.state == null ? '' : stateObj.state).trim();
  if (s === '' || s === 'unknown' || s === 'unavailable' || s === 'none') return null;
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}

// A real room sits around 20-90%. Outside that range the reading is noise, and
// 0 in particular means "sensor is not reporting", not "the room is bone dry".
function acHumidityNum(stateObj) {
  var n = acSensorNum(stateObj);
  return (n === null || n <= 0 || n > 100) ? null : n;
}

// ─── Fan speed model ────────────────────────────────────────────────────────
// 0 = slowest, 1 = fastest. Keyed by level NAME, never by position in the
// device's list: Gree orders its list [auto, low, medium_low, medium,
// medium_high, high, turbo, quiet], so `quiet` sits last and any
// position-based scale would spin the quietest setting fastest.
const AC_FAN_SPEED = {
  'auto': 0.60, 'min': 0.18, 'low': 0.25, 'low_mid': 0.40, 'medium_low': 0.40,
  'medium': 0.55, 'medium_high': 0.70, 'high_mid': 0.70, 'high': 0.85,
  'max': 1.00, 'turbo': 1.00, 'low/auto': 0.35, 'high/auto': 0.80, 'quiet': 0.12,
};
// 2.8s at the slowest, 0.7s at the fastest
function acFanSpinDuration(fanMode) {
  var s = AC_FAN_SPEED[fanMode];
  if (typeof s !== 'number') s = 0.5;
  return (2.8 - 2.1 * s).toFixed(2) + 's';
}

// ─── Fan / swing label resolution ───────────────────────────────────────────
// Device integrations invent their own vocabulary (Gree alone ships 8 fan and
// 12 vertical-swing identifiers), so an index lookup into a fixed table falls
// through to the raw string. tr.fanMap / tr.swingMap are looked up by VALUE
// first and cover both the generic names and the vendor ones; the indexed
// table stays as the fallback for anything not listed.
function acFanLabel(tr, value) {
  if (!value) return value;
  var map = (tr && tr.fanMap) || {};
  if (map[value]) return map[value];
  var idx = FAN_LEVELS.indexOf(value);
  if (idx >= 0 && tr && tr.fans && tr.fans[idx]) return tr.fans[idx];
  // The value is fan_mode -- a LIVE ENTITY ATTRIBUTE, not config. An integration
  // the tables do not know about reached the DOM raw through this fallback and
  // then through acValueLine. Escape it here so every consumer is covered once.
  return escHtml(value);
}

function acSwingLabel(tr, value, swingLabels) {
  if (!value) return value;
  var map = (tr && tr.swingMap) || {};
  if (map[value]) return map[value];
  var lbls = swingLabels || (tr && tr.swings) || [];
  var idx = SWING_LEVELS.indexOf(value);
  if (idx >= 0 && lbls[idx]) return lbls[idx];
  var nIdx = SWING_NUMERIC.indexOf(value);
  if (nIdx >= 0 && lbls[3 + nIdx]) return lbls[3 + nIdx];
  // Same reasoning as acFanLabel: this is swing_mode off the entity.
  return escHtml(value);
}

// ─── Swing icon: the glyph reports where the louver is ──────────────────────
// Three states, and the mode name already carries all three:
//   locked at an end   -> a single arrow that way, and it does NOT move
//   locked in between  -> the double arrow, and it does NOT move
//   sweeping           -> the double arrow, and it DOES move
// The motion is the part that was wrong before. An icon that jitters while the
// line under it reads 固定 tells the reader the opposite of the truth, and a
// still icon on a sweeping state says "held" while the louvers move. Only the
// `fixed_` values name a position the louver is held at, so that prefix -- not
// a word inside the value -- is what decides "parked".
function acSwingIconState(mode, axis) {
  var m = String(mode == null ? '' : mode).toLowerCase();
  var fixed = m.indexOf('fixed_') === 0;
  var v = 'both';
  // Endpoints only apply to a locked louver. swing_upmost is a RANGE that
  // currently sits at the top, not a louver pinned there, so it stays double.
  if (fixed) {
    if (axis === 'h') {
      if (/_leftmost$/.test(m)) v = 'left';
      else if (/_rightmost$/.test(m)) v = 'right';
    } else {
      if (/_upmost$/.test(m)) v = 'up';
      else if (/(downmost|lowest)$/.test(m)) v = 'down';
    }
  }
  var on = m !== '' && m !== 'off';
  return { variant: v, on: on, live: on && !fixed };
}

const AC_SWING_PATHS = {
  'up':    ['M17 25 L17 11', 'M12.5 15.5 L17 10.5 L21.5 15.5'],
  'down':  ['M17 9 L17 23', 'M12.5 18.5 L17 23.5 L21.5 18.5'],
  'left':  ['M25 17 L11 17', 'M15.5 12.5 L10.5 17 L15.5 21.5'],
  'right': ['M9 17 L23 17', 'M18.5 12.5 L23.5 17 L18.5 21.5'],
  'vBoth': ['M11 24 L11 13', 'M6.5 17 L11 12.5 L15.5 17', 'M23 10 L23 21', 'M18.5 16 L23 20.5 L27.5 16'],
  'hBoth': ['M14.5 17 L9 17', 'M12.5 12.5 L8.5 17 L12.5 21.5', 'M19.5 17 L25 17', 'M21.5 12.5 L25.5 17 L21.5 21.5'],
};

function acSwingIconSvg(state, axis, color, opacity, cls) {
  var key = state.variant === 'both' ? (axis === 'h' ? 'hBoth' : 'vBoth') : state.variant;
  var body = AC_SWING_PATHS[key].map(function (d) {
    return '<path d="' + d + '" stroke="' + color + '" stroke-width="2"'
      + ' stroke-linecap="round" stroke-linejoin="round" opacity="' + opacity + '"/>';
  }).join('');
  // Q rather than a literal quote: these lines are emitted into the card's
  // source, and a single quote written inline here is what makes the patch
  // script itself unparseable.
  var Q = String.fromCharCode(39);
  var live = state.live ? Q + ' swing-ico-svg--live' : '';
  return '<svg width="34" height="34" viewBox="0 0 34 34" preserveAspectRatio="xMidYMid meet"'
    + ' fill="none" class="' + cls + live + '"'
    + ' xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
}

// The value line under a control icon only earns its place when it says
// something the panel label does not. Gree reports
// swing_horizontal_mode: 'swing_full', which both language tables map to the
// same word as the panel label -- so that panel used to print it twice.
function acValueLine(text, label, cls) {
  if (!text || text === label) return '';
  return '<span class="' + (cls || 'swing-lbl') + '">' + text + '</span>';
}

// ─── Preset / feature chips ──────────────────────────────────────────────────
// Gree reports no preset_modes at all, and the upstream Fav and Clean chips had
// no id and no handler -- two of the three were pure decoration and the third
// called a service the unit does not support. The chips are therefore driven by
// the user's own config, with real preset_modes as a fallback.
function acChipSpec(cfg, tr, room, hass) {
  var configured = (cfg.preset_chips || []).filter(function(c) { return c && c.entity_id; });
  if (configured.length) {
    return configured.slice(0, 3).map(function(c, i) {
      var dom = String(c.entity_id).split('.')[0];
      var st  = hass && hass.states ? hass.states[c.entity_id] : null;
      var on  = !!(st && (st.state === 'on' || st.state === dom + '_on' || st.state === String(c.option || '')));
      var defLabel = [tr.presetEco, tr.presetFav, tr.presetClean][i] || tr.presetEco;
      return {
        entity_id: c.entity_id, domain: dom, option: c.option || '',
        label: c.label || (st && st.attributes && st.attributes.friendly_name) || defLabel,
        icon: c.icon || 'mdi:flash', on: on,
      };
    });
  }
  // Fallback: the unit's real presets, if it has any.
  var modes = room && hass ? (hass.states[room.id] && hass.states[room.id].attributes.preset_modes) : null;
  if (!modes || !modes.length) return [];   // nothing to control -> render nothing
  var cur = room ? (hass.states[room.id].attributes.preset_mode || '') : '';
  return modes.slice(0, 3).map(function(m, i) {
    return {
      entity_id: room.id, domain: 'climate', option: m, label: m,
      icon: ['mdi:leaf', 'mdi:star', 'mdi:spray-bottle'][i] || 'mdi:flash', on: cur === m,
    };
  });
}

function acChipCall(card, chip) {
  if (!chip || !chip.entity_id) return;
  if (chip.domain === 'climate') {
    var cur = card._a(chip.entity_id, 'preset_mode');
    card._call('climate', 'set_preset_mode',
      { entity_id: chip.entity_id, preset_mode: cur === chip.option ? 'none' : chip.option });
  } else if (chip.domain === 'select') {
    card._call('select', 'select_option', { entity_id: chip.entity_id, option: chip.option });
  } else {
    card._call('homeassistant', 'toggle', { entity_id: chip.entity_id });
  }
}

// One resolver, used both by the first paint and by the 10s live patch, so a
// reading can never be formatted two different ways. null means "no usable
// reading" -- the chip is then hidden rather than shown as a placeholder.
//
// OUTDOOR READINGS ONLY. The indoor temperature and humidity used to be here
// as a second pair of pills, taken from the room's own sensors rather than the
// climate entity. With the indoor/outdoor word removed from the pills there
// was nothing left to tell two temperatures and two humidities apart, and the
// room card / room tabs / Super Lite row already show the indoor side. The
// per-room sensors themselves are untouched -- only this strip stopped
// reading them.
function acSensorStripValues(card, cfg, room, tUnit) {
  var out = { 'out-temp': null, 'out-hum': null, pm25: null };
  var st = function (id) { return (id && card._hass && card._hass.states) ? card._hass.states[id] : null; };
  var deg = tUnit === 'F' ? '°F' : '°C';

  var oT = acSensorNum(st(cfg.outdoor_temp_entity));
  if (cfg.show_outdoor_temp !== false && oT !== null) out['out-temp'] = acFmtTemp(oT, tUnit, oT > 50 ? 'F' : 'C') + deg;
  var oH = acHumidityNum(st(cfg.outdoor_humidity_entity || cfg.humidity_entity));
  if (cfg.show_humidity !== false && oH !== null) out['out-hum'] = Math.round(oH) + '%';
  var pM = acSensorNum(st(cfg.pm25_entity));
  if (cfg.show_pm25 !== false && pM !== null) out.pm25 = String(pM);
  return out;
}

// ─── Power formatting ───────────────────────────────────────────────────────
// ONE formatter, used by every call site (first paint, Super Lite room row and
// the 10s live patch). Three copies of this logic previously disagreed, and a
// sensor reporting 860 W was labelled "860.00 kW".
//
//   rawState    - the sensor's `state` string
//   sensorUnit  - the sensor's `unit_of_measurement` ('W', 'kW', 'mW', ...)
//   displayUnit - the card's power_unit config: 'kw' (default) or 'w'
//
// Normalising through watts is what makes the display unit and the sensor unit
// independent, so both ends of the pipeline agree.
function acFmtPower(rawState, sensorUnit, displayUnit) {
  var raw = parseFloat(rawState);
  if (isNaN(raw)) return '--';
  var u = String(sensorUnit || 'W');
  var watts = /k/i.test(u) ? raw * 1000 : (/m/i.test(u) ? raw * 1e6 : raw);
  if (displayUnit === 'w') {
    // W mode keeps the advertised auto-promotion: >= 1000 W reads better in kW
    return watts >= 1000 ? (watts / 1000).toFixed(2) + ' kW' : Math.round(watts) + ' W';
  }
  return (watts / 1000).toFixed(2) + ' kW';
}

// ─── Temperature unit helpers ─────────────────────────────────────────────────
// haUnit: the unit the HA entity actually returns ('C' or 'F')
// tUnit:  the unit the user wants displayed ('C' or 'F')
// Only convert when haUnit and tUnit differ
function acCtoF(c) { return c * 9/5 + 32; }
function acFtoC(f) { return (f - 32) * 5/9; }
function acFmtTemp(val, tUnit, haUnit) {
  var hu = haUnit || 'C';
  if (isNaN(parseFloat(val))) return '--';
  val = parseFloat(val);
  if (hu === tUnit) return val.toFixed(1);
  if (hu === 'C' && tUnit === 'F') return acCtoF(val).toFixed(1);
  if (hu === 'F' && tUnit === 'C') return acFtoC(val).toFixed(1);
  return val.toFixed(1);
}
// ── HTML escaping ────────────────────────────────────────────────────────
// Room names, owner_name, quick-switch labels, preset names and room image
// URLs all come from the dashboard YAML or from a live entity attribute, and
// every one of them was concatenated straight into an HTML string. Applied at
// the point of output rather than to the stored config, because owner_name
// round-trips through a text input: escaping on the way IN would put '&amp;'
// back into the editor field the user is typing into.
//
// One function covers both jobs: this file emits every attribute double-quoted,
// and the set below is safe in text content and inside a quoted attribute.
function escHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// Room image URLs also land in src="". Escaping stops an attribute breakout;
// the scheme allowlist stops a javascript: URL reaching the browser at all.
// Relative paths and data:image/ stay allowed -- both are legitimate ways to
// point a card at a picture.
function escUrl(v) {
  if (!v) return '';
  // Drop ASCII control characters ANYWHERE, not just at the ends. trim() left an
  // interior tab in place, the anchored scheme test then missed
  // "java<TAB>script:...", and the browser's URL parser strips tab/LF/CR before
  // it resolves the scheme -- so that string really is a javascript: URL.
  // Space is deliberately KEPT: the URL parser does not remove it, it
  // percent-encodes it, and eating it would corrupt a legitimate query string.
  var s = String(v).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (/^(javascript|vbscript|file):/i.test(s)) return '';
  if (/^data:/i.test(s) && !/^data:image\//i.test(s)) return '';
  return escHtml(s);
}
function acTempUnit(unit) { return unit === 'F' ? '°F' : '°C'; }
// The ONLY place a temperature picks up a unit.
function acTempWithUnit(val, tUnit, haUnit) {
  var n = acFmtTemp(val, tUnit, haUnit);
  return n === '--' ? n : n + acTempUnit(tUnit);
}
// For set temperature display (integer steps)
function acFmtSetTemp(val, tUnit, haUnit) {
  var hu = haUnit || 'C';
  if (isNaN(parseFloat(val))) return val;
  val = parseFloat(val);
  if (hu === tUnit) return val;
  if (hu === 'C' && tUnit === 'F') return Math.round(acCtoF(val));
  if (hu === 'F' && tUnit === 'C') return Math.round(acFtoC(val));
  return val;
}
// Value to send to HA when the user taps +/- (always expressed in the HA unit)
// step: increment in display units (tUnit), converted back to haUnit before sending
function acTempStep(currentHaVal, step, tUnit, haUnit) {
  var hu = haUnit || 'C';
  // Convert current HA value → display unit, add step, convert back → HA unit
  if (hu === tUnit) {
    // Same unit: add 1 directly
    return currentHaVal + step;
  }
  if (hu === 'C' && tUnit === 'F') {
    // HA reports °C, the user reads °F: +1°F = +5/9°C, rounded to 0.5°C
    var dispF = acCtoF(currentHaVal) + step;
    return Math.round(acFtoC(dispF) * 2) / 2; // round to nearest 0.5°C
  }
  if (hu === 'F' && tUnit === 'C') {
    // HA reports °F, the user reads °C: +1°C = +1.8°F, rounded to 1°F
    var dispC = acFtoC(currentHaVal) + step;
    return Math.round(acCtoF(dispC));
  }
  return currentHaVal + step;
}
// Minimum set temperature, in the HA unit
function acMinTemp(haUnit) { return haUnit === 'F' ? 60 : 16; }
function acMaxTemp(haUnit) { return haUnit === 'F' ? 95 : 30; }

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=85', // living room
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=85', // bedroom
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=85',    // dining room
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=85', // office
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=85', // bathroom
  'https://images.unsplash.com/photo-1597773150796-e5c14ebecbf5?w=900&q=85', // kids room
  'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=900&q=85', // gym
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=85', // utility room
];

// Placeholder rooms used until the user configures real entities.
// The display labels are re-localised from the active language in setConfig().
const ROOMS_DEFAULT = [
  { id: 'climate.dieu_hoa_living',         label: 'Living room', area: '25 m²', icon: 'mdi:sofa' },
  { id: 'climate.bed_air_conditioning',     label: 'Bedroom',     area: '18 m²', icon: 'mdi:bed' },
  { id: 'climate.kitchen_air_conditioning', label: 'Dining room', area: '20 m²', icon: 'mdi:silverware-fork-knife' },
  { id: 'climate.dieu_hoa_office',          label: 'Study',       area: '15 m²', icon: 'mdi:briefcase' },
  { id: 'climate.dieu_hoa_bathroom',        label: 'Bathroom',    area: '8 m²',  icon: 'mdi:shower' },
  { id: 'climate.dieu_hoa_kids',            label: 'Kids room',   area: '14 m²', icon: 'mdi:teddy-bear' },
  { id: 'climate.dieu_hoa_gym',             label: 'Gym',         area: '20 m²', icon: 'mdi:dumbbell' },
  { id: 'climate.dieu_hoa_utility',         label: 'Utility',     area: '10 m²', icon: 'mdi:archive' },
];
var ROOMS = ROOMS_DEFAULT.slice(0, 4);

// MODE_CFG.lbl is only a last-resort fallback: every render site resolves the
// label through tr.modes[mode] first, so these stay English.
const MODE_CFG = {
  cool:     { lbl: 'Cool', icon: 'mdi:snowflake',      color: '#3b9eff', glow: 'rgba(59,158,255,0.55)'   },
  heat:     { lbl: 'Heat', icon: '\ud83d\udd25', color: '#ff7b3b', glow: 'rgba(255,123,59,0.55)'  },
  dry:      { lbl: 'Dry',  icon: '\ud83d\udca7', color: '#a78bfa', glow: 'rgba(167,139,250,0.55)' },
  fan_only: { lbl: 'Fan',  icon: '\ud83c\udf2c', color: '#34d399', glow: 'rgba(52,211,153,0.55)'  },
  auto:     { lbl: 'Auto', icon: 'mdi:autorenew', color: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
  off:      { lbl: 'Off',  icon: '\u25cb',       color: '#4b5563', glow: 'rgba(75,85,99,0.3)'     },
};

const FAN_LEVELS  = ['auto','min','low','low_mid','medium','high_mid','high','max','low/auto','high/auto','quiet'];
const SWING_LEVELS = ['off','vertical','horizontal','both'];
const SWING_ICONS  = ['\u2014','\u2195','\u2194','\u2716'];
const SWING_NUMERIC = ['1','2','3','4','5','6'];

// ─── CSS kept separate – injected only once ───────────────────────────────────
const CARD_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
button,a{touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
:host{display:block;font-family:'Sora',sans-serif}
.card{background:linear-gradient(135deg,rgba(180,220,255,0.22) 0%,rgba(120,200,220,0.18) 50%,rgba(100,180,210,0.22) 100%);
  backdrop-filter:blur(var(--card-blur,28px)) saturate(1.6);-webkit-backdrop-filter:blur(var(--card-blur,28px)) saturate(1.6);
  border-radius:28px;overflow:hidden;display:flex;align-items:stretch;width:100%;box-sizing:border-box;
  box-shadow:0 0 0 1px rgba(255,255,255,0.28),0 40px 120px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.45)}
.left{flex:1.22;background:linear-gradient(160deg,rgba(200,235,255,0.18) 0%,rgba(140,210,230,0.12) 100%);
  display:flex;flex-direction:column;padding:16px 16px 14px;gap:8px;
  position:relative;border-right:1px solid rgba(255,255,255,0.2);overflow:hidden}
.left::before{content:"";position:absolute;top:-120px;left:-70px;width:380px;height:380px;
  background:radial-gradient(circle,var(--glow) 0%,transparent 65%);pointer-events:none;opacity:0.25}
.hdr{display:flex;align-items:center;justify-content:space-between}
.hdr-brand{display:flex;align-items:center;gap:10px}
.hdr-ico{width:40px;height:40px;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 45%,#000));
  border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 24px var(--glow)}
.hdr-title{font-size:11px;font-weight:600;letter-spacing:1px;color:var(--cv-title,rgba(255,255,255,0.85));text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}
.hdr-sub{font-size:9px;color:rgba(40,80,110,0.5);margin-top:1px}
.hdr-icons{display:flex;gap:12px;align-items:center}
.hdr-vs-row{display:flex;align-items:center;gap:3px}
.hdr-vs-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);padding:5px 8px;border-radius:8px;cursor:pointer;color:rgba(255,255,255,0.4);transition:all 0.2s;line-height:0;display:flex;align-items:center;justify-content:center}
.hdr-vs-btn:hover{color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.25)}
.hdr-vs-btn--active{background:rgba(255,255,255,0.18)!important;color:#ffffff!important;border-color:rgba(255,255,255,0.3)!important;box-shadow:0 1px 4px rgba(0,0,0,0.3)}
@keyframes vsDotBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-3.2px)}}
.hdr-vs-btn--active circle:nth-child(1),.sl-vs-btn--active circle:nth-child(1){animation:vsDotBounce 0.9s ease-in-out infinite;animation-delay:0s;transform-origin:center;transform-box:fill-box}
.hdr-vs-btn--active circle:nth-child(2),.sl-vs-btn--active circle:nth-child(2){animation:vsDotBounce 0.9s ease-in-out infinite;animation-delay:0.18s;transform-origin:center;transform-box:fill-box}
.hdr-vs-btn--active circle:nth-child(3),.sl-vs-btn--active circle:nth-child(3){animation:vsDotBounce 0.9s ease-in-out infinite;animation-delay:0.36s;transform-origin:center;transform-box:fill-box}
.sl-vs-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);padding:5px 8px;border-radius:8px;cursor:pointer;color:rgba(255,255,255,0.4);transition:all 0.2s;line-height:0;display:flex;align-items:center;justify-content:center}
.sl-vs-btn:hover{color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.25)}
.sl-vs-btn--active{background:rgba(255,255,255,0.18)!important;color:#ffffff!important;border-color:rgba(255,255,255,0.3)!important;box-shadow:0 1px 6px rgba(0,0,0,0.3)}
.greet-row{display:flex;align-items:flex-start;justify-content:space-between}
.greet-sub{font-size:11.5px;color:var(--cv-greet-sub,rgba(255,255,255,0.65));font-weight:300}
.greet-name{font-size:22px;font-weight:700;color:var(--cv-greet-name,#ffffff);line-height:1.15;letter-spacing:-0.5px}
.dial-wrap{display:flex;justify-content:center;position:relative;margin:-2px 0 -14px}
.dial-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-26%);
  display:flex;flex-direction:column;align-items:center;pointer-events:none;user-select:none;width:150px;height:150px}
.dial-lbl{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--cv-dial-lbl,rgba(255,255,255,0.55));font-weight:500}
.dial-temp{font-family:'Orbitron',sans-serif;font-size:44px;font-weight:800;color:var(--cv-temp,#ffffff);line-height:1;
  text-shadow:0 0 30px var(--glow),0 0 60px var(--glow);transition:color 0.6s ease}
.dial-deg{font-size:24px;font-weight:400;vertical-align:super;line-height:0}
.dial-feel{font-size:12px;color:var(--cv-comfort,rgba(255,255,255,0.6));margin-top:6px;font-weight:300;text-align:center;
  max-width:130px;line-height:1.45;word-break:break-word;white-space:normal}
.temp-ctrl{display:flex;align-items:center;justify-content:center}
.eta-bar{display:flex;align-items:center;justify-content:center;gap:5px;
  padding:5px 12px;border-radius:20px;
  /* was rgba(59,158,255,0.10) on a near-white card -> effectively invisible */
  background:rgba(10,40,80,0.42);border:1px solid rgba(120,190,255,0.38);
  text-shadow:0 1px 2px rgba(0,0,0,0.35);
  font-size:10px;font-weight:700;color:var(--cv-eta,#cfe8ff);
  letter-spacing:0.2px;text-align:center;animation:etaFadeIn 0.5s ease}
@keyframes etaFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.eta-bar-sl{display:flex;align-items:center;justify-content:center;gap:4px;
  padding:4px 10px;border-radius:16px;
  background:rgba(59,158,255,0.10);border:1px solid rgba(59,158,255,0.22);
  font-size:9.5px;font-weight:600;color:rgba(180,220,255,0.88);
  letter-spacing:0.2px;text-align:center;animation:etaFadeIn 0.5s ease}
.temp-btn{width:40px;height:40px;border-radius:50%;background:rgba(0,20,50,0.25);
  border:1px solid rgba(255,255,255,0.25);color:rgba(255,255,255,0.9);font-size:24px;
  display:flex;align-items:center;justify-content:center;cursor:pointer;outline:none;transition:all 0.15s;font-family:'Sora',sans-serif}
.temp-btn:hover{background:rgba(0,30,70,0.4);border-color:var(--accent);color:var(--accent);box-shadow:0 0 18px var(--glow)}
.temp-btn:active{transform:scale(0.88)}
.temp-set{min-width:100px;text-align:center;font-family:'Orbitron',sans-serif;font-size:14px;font-weight:600;color:var(--cv-temp-set,rgba(255,255,255,0.85))}
.mode-dock-wrap{
  display:flex;align-items:flex-end;justify-content:center;
  background:rgba(0,15,40,0.45);
  border:1px solid rgba(255,255,255,0.18);
  border-radius:18px;
  padding:8px 8px 8px;
  gap:3px;
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  box-shadow:0 4px 24px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.1);
  position:relative;
  overflow-x:auto;overflow-y:hidden;
  max-width:100%;box-sizing:border-box;
  /* Overflow must stay scrollable (a 6th mode would still need it) but the
     scrollbar itself is a visible artifact in the middle of the card. */
  scrollbar-width:none;-ms-overflow-style:none;
  transition:gap 0.22s ease;
}
.mode-dock-wrap::-webkit-scrollbar{height:0;width:0;display:none}
.mode-btn{
  background:rgba(0,20,50,0.3);
  border:1px solid rgba(255,255,255,0.22);
  border-radius:13px;
  padding:8px 5px 6px;
  flex:0 1 auto;min-width:0;
  display:flex;flex-direction:column;align-items:center;gap:3px;
  cursor:pointer;outline:none;
  color:rgba(255,255,255,0.75);
  font-size:8px;font-weight:600;
  font-family:'Sora',sans-serif;
  transition:transform 0.22s cubic-bezier(.34,1.56,.64,1),
             background 0.2s ease,
             border-color 0.2s ease,
             box-shadow 0.2s ease,
             margin 0.22s cubic-bezier(.34,1.56,.64,1);
  transform-origin:bottom center;
  overflow:visible;position:relative;
  min-width:46px;
  flex-shrink:1;
}
.mode-btn:active{transform:scale(0.9) !important}
.mode-btn--active{
  background:linear-gradient(160deg,
    color-mix(in srgb,var(--cv-mode-active,var(--bc,var(--accent))) 55%,rgba(0,15,40,0.5)),
    color-mix(in srgb,var(--cv-mode-active,var(--bc,var(--accent))) 35%,rgba(0,15,40,0.4)));
  border-color:color-mix(in srgb,var(--cv-mode-active,var(--bc,var(--accent))) 80%,transparent);
  color:#ffffff;
  box-shadow:0 0 24px var(--bg,var(--glow)),inset 0 1px 0 rgba(255,255,255,0.25);
  transform:scale(1.0);
}
/* Active dot */
.mode-btn--active::after{content:'';position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);
  width:4px;height:4px;border-radius:50%;background:var(--bc,var(--accent,#00ffcc));
  box-shadow:0 0 6px var(--bc,var(--accent,#00ffcc));}
/* Dock hover: exactly one button reacts.
   This used to dim the whole row -- .mode-dock-wrap.dock-active .mode-btn
   {opacity:0.65} -- while only the hovered button actually moved. One lift
   plus four simultaneous dims in the same frame is what made the row look
   like five buttons being pressed at once. */
.mode-dock-wrap.dock-active .mode-btn.dock-hovered{z-index:10;border-color:rgba(255,255,255,0.6)}
/* No margin on hover: margin is layout, so it moved every sibling.
   dock-near1 / dock-near2 are gone: applyDock never added either class, so
   those two rules could never match anything. */
.mode-dock-wrap .mode-btn--active:not(.dock-hovered){transform:scale(1.0) !important}
/* Tooltip */
.mode-btn .dock-tooltip{
  position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%) scale(0.85);
  background:rgba(0,10,30,0.9);border:1px solid rgba(255,255,255,0.2);
  border-radius:7px;padding:3px 8px;font-size:9px;font-weight:600;
  color:#fff;white-space:nowrap;pointer-events:none;
  opacity:0;transition:opacity 0.15s,transform 0.15s;
  backdrop-filter:blur(8px);
}
.mode-dock-wrap.dock-active .mode-btn.dock-hovered .dock-tooltip{opacity:1;transform:translateX(-50%) scale(1)}
/* Fixed square: the dock mixes 22px mdi SVGs with 18px emoji glyphs. Without an
   explicit box each button sized itself to its own icon, so the row came out
   4px ragged and the icons staggered. Both systems centre in the same square
   now, and 24px leaves room for the scale(1.22) hover/active keyframes. */
.mode-icon{font-size:22px;line-height:1;width:24px;height:24px;flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;
  transition:transform 0.25s ease,filter 0.25s ease}
.mode-lbl{font-size:8px;color:var(--cv-mode-lbl,inherit);white-space:nowrap;line-height:1.2}

/* ── Hover: Cool — spinning snowflake + glow ── */
@keyframes modeCoolSpin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.25)}100%{transform:rotate(360deg) scale(1)}}
@keyframes modeCoolGlow{0%,100%{filter:drop-shadow(0 0 4px #3b9eff)}50%{filter:drop-shadow(0 0 12px #3b9eff) drop-shadow(0 0 22px #a8d8ff)}}
.mode-btn[data-hvac="cool"]:hover .mode-icon{animation:modeCoolSpin 1.1s linear infinite,modeCoolGlow 1.1s ease-in-out infinite}
.mode-btn[data-hvac="cool"]:hover{background:rgba(20,60,120,0.5);border-color:#3b9eff;box-shadow:0 4px 20px rgba(59,158,255,0.35),inset 0 0 14px rgba(59,158,255,0.1)}
.mode-btn[data-hvac="cool"].mode-btn--active .mode-icon{animation:modeCoolSpin 1.6s linear infinite,modeCoolGlow 1.6s ease-in-out infinite}

/* ── Hover: Heat — flames flicker ── */
@keyframes modeHeatFlicker{0%{transform:scale(1) rotate(-3deg)}20%{transform:scale(1.18) rotate(2deg)}40%{transform:scale(1.08) rotate(-2deg)}60%{transform:scale(1.22) rotate(3deg)}80%{transform:scale(1.1) rotate(-1deg)}100%{transform:scale(1) rotate(-3deg)}}
@keyframes modeHeatGlow{0%,100%{filter:drop-shadow(0 0 5px #ff7b3b)}50%{filter:drop-shadow(0 0 14px #ff7b3b) drop-shadow(0 0 26px #ffcc44)}}
.mode-btn[data-hvac="heat"]:hover .mode-icon{animation:modeHeatFlicker 0.7s ease-in-out infinite,modeHeatGlow 0.7s ease-in-out infinite}
.mode-btn[data-hvac="heat"]:hover{background:rgba(80,30,10,0.5);border-color:#ff7b3b;box-shadow:0 4px 20px rgba(255,123,59,0.4),inset 0 0 14px rgba(255,123,59,0.12)}
/* Heat sits still while it is the running mode: the glow pulse stays (it is a
   drop-shadow, not a rotation, and it is the "this is running" signal), the
   spin goes. Hovering still animates -- that is the pointer, not the state. */
.mode-btn[data-hvac="heat"].mode-btn--active .mode-icon{animation:modeHeatGlow 1.6s ease-in-out infinite}

/* ── Hover: Dry — bouncing water droplet ── */
@keyframes modeDryBounce{0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(-5px) scale(0.92)}60%{transform:translateY(2px) scale(1.1)}80%{transform:translateY(-2px) scale(0.97)}}
@keyframes modeDryGlow{0%,100%{filter:drop-shadow(0 0 4px #a78bfa)}50%{filter:drop-shadow(0 0 12px #a78bfa) drop-shadow(0 0 20px #d8b4fe)}}
.mode-btn[data-hvac="dry"]:hover .mode-icon{animation:modeDryBounce 1s ease-in-out infinite,modeDryGlow 1s ease-in-out infinite}
.mode-btn[data-hvac="dry"]:hover{background:rgba(50,20,90,0.5);border-color:#a78bfa;box-shadow:0 4px 20px rgba(167,139,250,0.35),inset 0 0 14px rgba(167,139,250,0.1)}
.mode-btn[data-hvac="dry"].mode-btn--active .mode-icon{animation:modeDryGlow 1.6s ease-in-out infinite}

/* ── Hover: Fan — wind blows right (horizontal shake) ── */
@keyframes modeFanBlow{0%{transform:translateX(0) rotate(0deg)}15%{transform:translateX(3px) rotate(8deg)}30%{transform:translateX(-1px) rotate(-4deg)}50%{transform:translateX(4px) rotate(10deg)}70%{transform:translateX(-2px) rotate(-5deg)}85%{transform:translateX(3px) rotate(6deg)}100%{transform:translateX(0) rotate(0deg)}}
@keyframes modeFanGlow{0%,100%{filter:drop-shadow(0 0 4px #34d399)}50%{filter:drop-shadow(0 0 12px #34d399) drop-shadow(0 0 22px #6ee7b7)}}
.mode-btn[data-hvac="fan_only"]:hover .mode-icon{animation:modeFanBlow 0.9s ease-in-out infinite,modeFanGlow 0.9s ease-in-out infinite}
.mode-btn[data-hvac="fan_only"]:hover{background:rgba(10,60,40,0.5);border-color:#34d399;box-shadow:0 4px 20px rgba(52,211,153,0.35),inset 0 0 14px rgba(52,211,153,0.1)}
.mode-btn[data-hvac="fan_only"].mode-btn--active .mode-icon{animation:modeFanGlow 1.6s ease-in-out infinite}

/* ── Hover: Auto — auto-rotate + amber glow ── */
@keyframes modeAutoSpin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.2)}100%{transform:rotate(360deg) scale(1)}}
@keyframes modeAutoGlow{0%,100%{filter:drop-shadow(0 0 4px #f59e0b)}50%{filter:drop-shadow(0 0 14px #f59e0b) drop-shadow(0 0 26px #fcd34d)}}
/* Auto used to spin on a timer whether or not Auto was the selected mode -- the
   only button that did. Now every mode's icon moves on hover and while that
   mode is selected, and sits still otherwise. */
.mode-btn[data-hvac="auto"]:hover .mode-icon{animation:modeAutoSpin 1.0s linear infinite,modeAutoGlow 1.0s ease-in-out infinite}
.mode-btn[data-hvac="auto"]:hover{background:rgba(80,50,5,0.5);border-color:#f59e0b;box-shadow:0 4px 20px rgba(245,158,11,0.4),inset 0 0 14px rgba(245,158,11,0.12)}
.mode-btn[data-hvac="auto"].mode-btn--active .mode-icon{animation:modeCoolSpin 1.6s linear infinite,modeAutoGlow 1.6s ease-in-out infinite}
/* Hovering the mode that is already running must not strip its selected look.
   .mode-btn[data-hvac="x"]:hover scores (0,3,0) and beats .mode-btn--active
   (0,1,0), so the running mode lost its gradient and glow the moment the
   pointer touched it. Same specificity as the hover rules, declared after
   them, so this wins. The running mode keeps gradient + glow + its 1.6s spin
   no matter where the pointer is. */
.mode-dock-wrap .mode-btn--active:hover{
  background:linear-gradient(160deg,
    color-mix(in srgb,var(--cv-mode-active,var(--bc,var(--accent))) 55%,rgba(0,15,40,0.5)),
    color-mix(in srgb,var(--cv-mode-active,var(--bc,var(--accent))) 35%,rgba(0,15,40,0.4)));
  border-color:color-mix(in srgb,var(--cv-mode-active,var(--bc,var(--accent))) 80%,transparent);
  color:#ffffff;
  box-shadow:0 0 24px var(--bg,var(--glow)),inset 0 1px 0 rgba(255,255,255,0.25);
}

/* ── Cool Active: Trail animation overlay ── */
.dial-wrap{position:relative}
/* Drag cursor hint on outer ring SVG */
#dial-wrap-main svg { touch-action: none; }

/* ── Hover: dial-temp — slight shrink + a measured glow ── */
@keyframes dialTempPulse{0%,100%{filter:brightness(1) drop-shadow(0 0 6px currentColor)}50%{filter:brightness(1.15) drop-shadow(0 0 14px currentColor) drop-shadow(0 0 24px currentColor)}}
.dial-temp{font-size:44px;transition:transform 0.25s cubic-bezier(.34,1.56,.64,1),filter 0.25s ease;cursor:default}
.dial-center:hover .dial-temp,.dial-wrap:hover .dial-temp{transform:scale(1.12);animation:dialTempPulse 1.8s ease-in-out infinite}
.sl-temp-val{transition:transform 0.25s cubic-bezier(.34,1.56,.64,1),filter 0.25s ease;cursor:default}
.sl-dial-center:hover .sl-temp-val,.sl-dial-wrap:hover .sl-temp-val{transform:scale(1.12);animation:dialTempPulse 1.8s ease-in-out infinite}
/* ha-icon inside mode-icon inherits the animation from the parent */
.mode-icon ha-icon,.mode-icon>*{pointer-events:none;display:inline-flex;flex:0 0 auto;line-height:1}
.qs-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;min-width:0}
.qs-btn{display:flex;align-items:center;gap:4px;padding:5px 9px;border-radius:999px;
  font-size:10.5px;font-weight:600;line-height:1.2;cursor:pointer;min-width:0;flex:0 0 auto;
  background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.22);color:rgba(255,255,255,0.8);
  transition:background .2s,border-color .2s,color .2s;white-space:nowrap}
.qs-btn.qs-on{background:var(--accent);border-color:rgba(255,255,255,0.55);color:#fff;
  box-shadow:0 0 10px var(--glow)}
.qs-btn.qs-off{opacity:.45;cursor:not-allowed}
.qs-btn .qs-ico{display:inline-flex;align-items:center;flex-shrink:0}
.qs-lbl{overflow:hidden;text-overflow:ellipsis;max-width:80px}
/* Every panel in this row is label / centred icon / value, in equal columns.
   The column count is set inline from how many panels are really rendered. */
.fan-swing-row{display:grid;gap:8px;min-width:0;align-items:stretch}
.fan-card,.swing-card{background:rgba(0,20,50,0.28);border:1px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:9px 10px;display:flex;flex-direction:column;gap:5px;min-width:0;overflow:hidden}
.fc-head{display:flex;align-items:center;justify-content:space-between;gap:2px;min-height:11px}
.fc-label{font-size:8px;letter-spacing:0.8px;text-transform:uppercase;color:var(--cv-fc-label,rgba(255,255,255,0.55));font-weight:700;word-break:break-word;overflow-wrap:break-word;line-height:1.35;max-width:100%}
/* The value is the last item in the button and absorbs the leftover height, so
   a value that wraps to a second line grows upward instead of pushing its icon
   out of line with the other panels. Bottom-aligned, so all three values land
   on one baseline. */
.fc-val,.swing-lbl{flex:0 0 auto;display:block;
  font-size:9px;font-weight:600;line-height:1.2;text-align:center;max-width:100%;
  white-space:normal;overflow-wrap:break-word;word-break:break-word}
.fc-val{color:var(--cv-fc-val,rgba(255,255,255,0.95))}
.swing-lbl{color:var(--cv-swing-lbl,rgba(255,255,255,0.7))}
.fan-ico{font-size:26px;opacity:0.9;line-height:1;flex-shrink:0;display:flex;align-items:center;justify-content:center}
@keyframes fanSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.fan-bars{display:flex;align-items:flex-end;justify-content:center;gap:3px;height:16px}
.fbar{width:5px;border-radius:3px 3px 2px 2px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);transition:all 0.3s;flex-shrink:0}
.fbar.fbar-on{background:var(--cv-fan-bar,var(--accent));border-color:rgba(255,255,255,0.55);box-shadow:0 0 8px var(--glow),0 0 3px rgba(255,255,255,0.3),inset 0 1px 0 rgba(255,255,255,0.35)}
/* One rule for both control types -- this is what makes the row line up.
   justify-content:center, so the icon / bars / value group is centred as a
   whole. A 1fr grid was tried first: it pinned the value to the bottom, but the
   fan panel carries an extra row for the bar chart, so its 1fr shrank and
   pushed that icon 9px above the other two (490.7 / 499.9 / 501.7). Exact icon
   alignment is unreachable when one panel holds an extra element; what reads
   as "harmonious" is each panel's content being centred and proportionate. */
.fan-tap,.swing-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:5px;flex:1;min-height:0;width:100%;background:none;border:none;padding:0;
  cursor:pointer;outline:none}
.fan-tap>.fan-ico,.swing-btn>svg,.fan-tap>.fan-bars{flex:0 0 auto}
/* Direction indicator. Only animates while the control is actually in use. */
@keyframes swingBobUpDown{0%,100%{transform:translateY(-1.8px)}50%{transform:translateY(1.8px)}}
@keyframes swingBobLeftRight{0%,100%{transform:translateX(-1.8px)}50%{transform:translateX(1.8px)}}
.swing-ico-svg--live{animation:swingBobUpDown 1.7s ease-in-out infinite}
.swing-ico-svg.swing-h.swing-ico-svg--live{animation-name:swingBobLeftRight}
/* ── Damper control button (thay airflow khi Central AC) ── */
.damper-ctrl-btn{
  display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;
  background:rgba(0,20,50,0.35);border:1px solid rgba(255,255,255,0.22);border-radius:14px;
  cursor:pointer;outline:none;font-family:'Sora',sans-serif;
  transition:all 0.2s cubic-bezier(.34,1.56,.64,1);text-align:left;
  position:relative;overflow:hidden;
}
.damper-ctrl-btn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(0,212,255,0.06),rgba(0,100,180,0.04));
  border-radius:14px;
}
.damper-ctrl-btn:hover{background:rgba(0,40,100,0.5);border-color:rgba(0,212,255,0.45);transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,212,255,0.15)}
.damper-ctrl-btn:active{transform:scale(0.98)}
.damper-ctrl-ico{font-size:22px;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(0,212,255,0.4))}
.damper-ctrl-info{flex:1;min-width:0}
.damper-ctrl-title{font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:2px}
.damper-ctrl-summary{font-size:12px;font-weight:700;color:#00d4ff;letter-spacing:0.2px}
.damper-ctrl-arrow{font-size:16px;color:rgba(255,255,255,0.4);flex-shrink:0}
/* ── Damper full popup (all dampers in one popup) ── */
.damper-all-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);
  z-index:9100;display:flex;align-items:flex-end;justify-content:center;
  padding-bottom:env(safe-area-inset-bottom,0px)}
.damper-all-popup{
  background:linear-gradient(160deg,rgba(0,15,38,0.98),rgba(0,28,60,0.98));
  border:1px solid rgba(255,255,255,0.14);border-radius:24px 24px 0 0;
  padding:20px 20px 28px;width:100%;max-width:460px;box-sizing:border-box;
  max-height:80vh;overflow-y:auto;
  animation:dampAllUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes dampAllUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
.damper-all-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.damper-all-title{font-size:14px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px}
.damper-all-close{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.1);
  border:none;cursor:pointer;font-size:16px;color:rgba(255,255,255,0.7);
  display:flex;align-items:center;justify-content:center;transition:background 0.15s;font-family:'Sora',sans-serif}
.damper-all-close:hover{background:rgba(255,255,255,0.2)}
.damper-all-item{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
  border-radius:14px;padding:14px 16px 12px;margin-bottom:10px}
.damper-all-item:last-child{margin-bottom:0}
.damper-all-item-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.damper-all-item-name{font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);display:flex;align-items:center;gap:6px}
.damper-all-item-pct{font-size:20px;font-weight:700;letter-spacing:-0.5px;min-width:50px;text-align:right}
.damper-all-slider{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;
  background:rgba(255,255,255,0.15);outline:none;cursor:pointer;margin:2px 0 6px;display:block}
.damper-all-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;
  background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.4),0 0 0 3px var(--accent);cursor:grab;transition:transform 0.1s}
.damper-all-slider::-webkit-slider-thumb:active{transform:scale(1.15);cursor:grabbing}
.damper-all-quick{display:flex;gap:6px;margin-top:8px}
.damper-all-quick-btn{flex:1;padding:6px 4px;border-radius:8px;font-size:9px;font-weight:700;
  border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);
  color:rgba(255,255,255,0.7);cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.15s}
.damper-all-quick-btn:hover{background:rgba(255,255,255,0.14);color:#fff}
.damper-all-quick-btn.active{background:var(--accent,#00ffcc);color:#002030;border-color:var(--accent,#00ffcc)}
.damper-all-footer{display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08)}
.damper-all-btn{flex:1;padding:11px;border-radius:12px;font-size:13px;font-weight:700;
  border:none;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.15s}
.damper-all-btn--close{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)}
.damper-all-btn--apply{background:var(--accent,#00ffcc);color:#002030}
.damper-all-btn--close:hover{background:rgba(255,255,255,0.18)}
.damper-all-btn--apply:hover{filter:brightness(1.1)}
/* ── Damper list ── */
.damper-list{display:flex;flex-direction:column;gap:6px;margin-top:6px}
/* ── Damper popup overlay ── */
.damper-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);
  z-index:9000;display:flex;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom)}
.damper-popup{background:linear-gradient(160deg,rgba(0,18,45,0.97),rgba(0,30,65,0.97));
  border:1px solid rgba(255,255,255,0.15);border-radius:22px 22px 0 0;
  padding:20px 20px 28px;width:100%;max-width:420px;box-sizing:border-box;
  animation:dampPopUp 0.28s cubic-bezier(0.34,1.56,0.64,1)}
@keyframes dampPopUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
.damper-popup-title{font-size:13px;font-weight:700;color:rgba(255,255,255,0.9);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.damper-popup-val{font-size:32px;font-weight:700;text-align:center;margin-bottom:12px;letter-spacing:-0.5px}
.damper-popup-slider{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;
  background:rgba(255,255,255,0.15);outline:none;cursor:pointer;margin:4px 0 16px}
.damper-popup-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;
  background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.4),0 0 0 3px var(--accent);cursor:grab;transition:transform 0.1s}
.damper-popup-slider::-webkit-slider-thumb:active{transform:scale(1.15);cursor:grabbing}
.damper-popup-btns{display:flex;gap:8px;margin-top:4px}
.damper-popup-btn{flex:1;padding:10px;border-radius:12px;font-size:13px;font-weight:700;
  border:none;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.15s}
.chips{display:flex;gap:7px}
.chip{flex:1;background:rgba(0,20,50,0.28);border:1px solid rgba(255,255,255,0.25);
  border-radius:12px;padding:7px 4px;display:flex;align-items:center;justify-content:center;gap:4px;
  cursor:pointer;outline:none;font-size:9px;font-weight:600;font-family:'Sora',sans-serif;
  color:rgba(255,255,255,0.75);transition:all 0.2s;white-space:nowrap}
.chip:hover{background:rgba(0,30,70,0.45);transform:translateY(-1px)}
.chip:active{transform:scale(0.95)}
.chip--g{color:#ffffff;border-color:rgba(52,211,153,0.7)!important;background:rgba(52,211,153,0.35)!important}
.chip--a{color:#ffffff;border-color:rgba(251,191,36,0.7)!important;background:rgba(251,191,36,0.35)!important}
.chip--b{color:#ffffff;border-color:rgba(96,165,250,0.7)!important;background:rgba(96,165,250,0.35)!important}
.power-row{display:flex;align-items:center;gap:12px;
  background:linear-gradient(145deg,rgba(20,40,80,0.75),rgba(10,25,55,0.85));
  border:1px solid rgba(255,255,255,0.22);border-radius:18px;padding:10px 14px;
  cursor:pointer;outline:none;text-align:left;font-family:'Sora',sans-serif;width:100%;
  box-shadow:0 5px 0 rgba(0,0,0,0.55),0 7px 14px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.2);
  transform:translateY(-2px);
  transition:transform 0.12s ease,box-shadow 0.12s ease,background 0.15s}
.power-row:hover{
  background:linear-gradient(145deg,rgba(30,55,110,0.85),rgba(15,35,75,0.92));
  transform:translateY(-4px);
  box-shadow:0 7px 0 rgba(0,0,0,0.55),0 10px 22px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.2)}
.power-row:active{
  transform:translateY(1px);
  box-shadow:0 2px 0 rgba(0,0,0,0.55),0 3px 8px rgba(0,0,0,0.3),inset 0 2px 4px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.06)}
.pw-btn{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:19px;transition:all 0.35s}
.pw-on{
  background:linear-gradient(135deg,var(--pw-color1,#3b9eff),var(--pw-color2,#1a5faa));
  box-shadow:0 0 26px var(--pw-glow,rgba(59,158,255,0.7)),0 0 50px var(--pw-glow,rgba(59,158,255,0.25));
  animation:pwP 2.5s ease-in-out infinite}
.pw-off{
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.22);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 2px 8px rgba(0,0,0,0.2);
}
@keyframes pwP{0%,100%{box-shadow:0 0 26px var(--pw-glow,rgba(59,158,255,0.7)),0 0 50px var(--pw-glow,rgba(59,158,255,0.25))}50%{box-shadow:0 0 40px var(--pw-glow,rgba(59,158,255,0.95)),0 0 70px var(--pw-glow,rgba(59,158,255,0.45))}}
.pw-sub{font-size:9px;color:rgba(255,255,255,0.5);margin-top:2px}
.pw-sub--big{font-size:13px;font-weight:600;color:var(--cv-power-lbl,rgba(255,255,255,0.85));letter-spacing:0.2px}
.confirm-popup{position:fixed;z-index:9999;
  background:rgba(6,10,24,0.98);backdrop-filter:blur(28px) saturate(1.8);-webkit-backdrop-filter:blur(28px) saturate(1.8);
  border:1px solid rgba(255,80,80,0.35);border-radius:20px;padding:18px 16px 14px;width:220px;
  box-shadow:0 8px 48px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)}
.cp-title{font-size:13px;font-weight:700;color:#ffffff;text-align:center;margin-bottom:5px}
.cp-sub{font-size:9px;color:rgba(255,150,150,0.75);text-align:center;margin-bottom:14px;letter-spacing:0.3px}
.cp-acts{display:flex;gap:8px}
.cp-cancel{flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);
  border-radius:10px;padding:9px;font-size:10px;font-weight:600;font-family:'Sora',sans-serif;
  color:rgba(255,255,255,0.6);cursor:pointer;outline:none;touch-action:manipulation}
.cp-ok{flex:1;background:rgba(255,60,60,0.22);border:1px solid rgba(255,80,80,0.6);
  border-radius:10px;padding:9px;font-size:10px;font-weight:700;font-family:'Sora',sans-serif;
  color:#ff6b6b;cursor:pointer;outline:none;touch-action:manipulation}
.pw-arrow{color:rgba(255,255,255,0.4);font-size:20px}
.right{flex:1;background:linear-gradient(160deg,rgba(160,220,240,0.10) 0%,rgba(100,180,210,0.08) 100%);display:flex;flex-direction:column;position:relative;overflow-x:hidden;overflow-y:visible;min-height:0}
.right--lite{flex:0 0 45%;min-width:0;max-width:none}
.left--lite{flex:0 0 55%}
.card--lite{min-height:0 !important}
.lite-bottom{display:flex;flex-direction:column;gap:6px;padding:8px 8px 10px;margin-top:8px}
.power-row--lite{padding:7px 8px;border-radius:12px;gap:7px}
.power-row--lite .pw-btn{width:32px;height:32px;font-size:16px}
.power-row--lite .pw-sub--big{font-size:11px}
.lite-bottom-row{display:flex;gap:6px}
.lite-small-btn{flex:1;border-radius:12px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  background:rgba(0,20,50,0.28);border:1px solid rgba(255,255,255,0.22);cursor:pointer;outline:none;font-family:'Sora',sans-serif;min-width:0}
.lite-small-btn:hover{background:rgba(0,30,70,0.45)}
.lite-small-btn:active{transform:scale(0.96)}
.lite-small-btn .lsb-ico{font-size:16px;line-height:1}
.lite-small-btn .lsb-lbl{font-size:9px;font-weight:600;color:rgba(255,255,255,0.65);letter-spacing:0.3px;text-align:center;white-space:nowrap}
.lite-small-btn .lsb-cd{font-family:'Orbitron',sans-serif;font-size:8px;color:rgba(251,191,36,0.9);min-height:10px}
.lite-small-btn--timer-active{border-color:rgba(251,191,36,0.75)!important;background:rgba(251,191,36,0.12)!important;box-shadow:0 0 12px rgba(251,191,36,0.2)}
.lite-small-btn--alloff{
  background:linear-gradient(145deg,rgba(220,38,38,0.78),rgba(180,15,15,0.85)) !important;
  border-color:rgba(255,120,120,0.5) !important;
  box-shadow:0 4px 0 rgba(100,0,0,0.65),0 6px 14px rgba(220,38,38,0.4),inset 0 1px 0 rgba(255,180,180,0.25) !important;
  transform:translateY(-2px);
  transition:transform 0.12s ease,box-shadow 0.12s ease !important;
  animation:allOffPulseLite 2.4s ease-in-out infinite;
}
@keyframes allOffPulseLite{
  0%,100%{box-shadow:0 4px 0 rgba(100,0,0,0.65),0 6px 14px rgba(220,38,38,0.4),inset 0 1px 0 rgba(255,180,180,0.25),0 0 0 0 rgba(220,38,38,0)}
  50%{box-shadow:0 4px 0 rgba(100,0,0,0.65),0 8px 22px rgba(220,38,38,0.58),inset 0 1px 0 rgba(255,180,180,0.25),0 0 16px 3px rgba(220,38,38,0.25)}
}
.lite-small-btn--alloff:hover{
  background:linear-gradient(145deg,rgba(239,68,68,0.9),rgba(200,25,25,0.92)) !important;
  border-color:rgba(255,150,150,0.65) !important;
  transform:translateY(-4px) !important;
  box-shadow:0 6px 0 rgba(100,0,0,0.65),0 10px 22px rgba(220,38,38,0.55),inset 0 1px 0 rgba(255,200,200,0.35) !important;
  animation:none !important;
}
.lite-small-btn--alloff:active{
  transform:translateY(1px) !important;
  box-shadow:0 1px 0 rgba(100,0,0,0.65),0 3px 8px rgba(220,38,38,0.3),inset 0 2px 3px rgba(0,0,0,0.25) !important;
  animation:none !important;
}
.lite-small-btn--alloff .lsb-ico{color:#ffc0c0;text-shadow:0 0 10px rgba(255,80,80,0.7)}
.lite-small-btn--alloff .lsb-lbl{color:var(--cv-alloff-lbl,#ffb0b0);font-weight:700 !important;text-shadow:0 1px 4px rgba(255,60,60,0.5)}
.room-image{flex:0 0 185px;position:relative;overflow:hidden}
.room-img-el{width:100%;height:100%;object-fit:cover;transition:opacity 0.6s ease,transform 0.8s ease;display:block}
.room-img-el.fade-out{opacity:0;transform:scale(1.04)}
.room-image::after{content:"";position:absolute;inset:0;
  background:linear-gradient(to bottom,rgba(10,12,16,0.05) 0%,rgba(10,12,16,0) 15%,rgba(10,12,16,0.45) 55%,rgba(10,12,16,0.82) 78%,rgba(10,12,16,1) 100%);
  pointer-events:none;z-index:1}
.room-image::before{content:"";position:absolute;bottom:-1px;left:0;right:0;height:80px;
  background:inherit;filter:blur(18px) brightness(0.4);
  mask-image:linear-gradient(to bottom,transparent 0%,black 60%);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 60%);
  pointer-events:none;z-index:0}
.ac-overlay{position:absolute;top:12px;left:50%;transform:translateX(-50%);
  background:rgba(8,10,20,0.52);backdrop-filter:blur(16px) saturate(1.8);-webkit-backdrop-filter:blur(16px) saturate(1.8);
  border:1px solid rgba(255,255,255,0.18);border-radius:30px;padding:6px 16px;
  display:flex;align-items:center;gap:8px;z-index:3;white-space:nowrap;
  box-shadow:0 8px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.12)}
.ac-led{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.led-on{background:#34d399;box-shadow:0 0 10px #34d399,0 0 20px rgba(52,211,153,0.5);animation:blink 2.5s infinite}
.led-off{background:#4b5563}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
.ac-overlay-txt{font-size:9.5px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:1.5px}
.ac-mode-chip{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:var(--accent);
  font-size:8.5px;font-weight:600;padding:2px 9px;border-radius:10px}
.img-temp-badge{position:absolute;bottom:18px;left:14px;z-index:3;
  font-family:'Orbitron',sans-serif;font-size:28px;font-weight:800;
  color:#ffffff;line-height:1;
  text-shadow:0 0 18px var(--glow),0 0 40px var(--glow),0 2px 20px rgba(0,0,0,0.7);
  animation:tempPulse 2.2s ease-in-out infinite}
.img-temp-badge span{font-size:13px;opacity:0.7;font-weight:400}
@keyframes tempPulse{
  0%,100%{text-shadow:0 0 14px var(--glow),0 0 30px var(--glow),0 2px 20px rgba(0,0,0,0.7);opacity:1}
  40%{text-shadow:0 0 28px var(--glow),0 0 60px var(--glow),0 0 90px var(--glow),0 2px 20px rgba(0,0,0,0.6);opacity:1}
  55%{text-shadow:0 0 14px var(--glow),0 0 30px var(--glow),0 2px 20px rgba(0,0,0,0.7);opacity:0.92}
  70%{text-shadow:0 0 22px var(--glow),0 0 50px var(--glow),0 0 75px var(--glow),0 2px 20px rgba(0,0,0,0.6);opacity:1}
  85%{text-shadow:0 0 14px var(--glow),0 0 30px var(--glow),0 2px 20px rgba(0,0,0,0.7);opacity:0.95}
}
.img-room-name{position:absolute;bottom:18px;right:14px;z-index:3;
  font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);text-align:right}
.status-block{padding:8px 12px 6px;display:flex;flex-direction:column;gap:7px;
  background:linear-gradient(to bottom,rgba(10,12,16,0.92) 0%,rgba(10,20,40,0.55) 100%);
  margin-top:-2px}
.status-header{display:flex;align-items:center;justify-content:space-between}
.st-title{font-size:8.5px;letter-spacing:2px;text-transform:uppercase;color:var(--cv-st-title,rgba(255,255,255,0.55));font-weight:600}
.st-on{font-size:13px;font-weight:700;color:var(--cv-status-on,#34d399);margin-top:2px}
.st-off{font-size:13px;font-weight:700;color:var(--cv-status-off,rgba(255,255,255,0.45));margin-top:2px}
.st-sub{font-size:9.5px;color:var(--cv-st-sub,rgba(255,255,255,0.5));margin-top:1px}
.pm-ring{width:52px;height:52px;border-radius:50%;
  background:radial-gradient(circle,rgba(52,211,153,0.22) 0%,rgba(52,211,153,0.08) 60%,rgba(0,20,50,0.4) 100%);
  border:1.5px solid rgba(52,211,153,0.5);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 0 18px rgba(52,211,153,0.35),0 0 40px rgba(52,211,153,0.15),inset 0 1px 0 rgba(52,211,153,0.25)}
.pm-val{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:600;color:#34d399;line-height:1.1}
.pm-unit{font-size:7px;color:rgba(52,211,153,0.5);letter-spacing:0.5px}
/* One wrapping row of pills, as approved in the user's screenshot. A 2x2 grid
   was tried and reverted: the strip holds at most the two outdoor readings, so
   a two-column grid and a wrapping row come out identical -- and the grid cost
   a third row and a full-width orphan cell whenever a third reading appeared. */
.sens-row{display:flex;gap:5px;min-width:0;flex-wrap:wrap;margin-top:6px}
.sens{flex:1 1 auto;min-width:0;display:flex;align-items:baseline;gap:3px;
  background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.10);
  border-radius:9px;padding:4px 7px}
.sens-ico{font-size:11px;line-height:1;flex-shrink:0;align-self:center}
.sens-val{font-family:'Orbitron',sans-serif;font-size:11px;font-weight:600;color:#fff;white-space:nowrap}
/* Two control rows stacked with no labels read as one wall of pills, so the
   user could not tell which row was their own switches and which was preset. */
.switch-group{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.group-lbl{font-size:7.5px;letter-spacing:0.6px;text-transform:uppercase;
  color:rgba(255,255,255,0.45);font-weight:700;padding-left:2px}

.room-status-badge{font-size:9px;font-weight:700;letter-spacing:0.3px;padding:3px 8px;border-radius:7px;flex-shrink:0;line-height:1.5;min-width:32px;text-align:center;align-self:center}
.rsb-on{background:color-mix(in srgb,var(--cv-room-on,var(--accent)) 55%,rgba(0,10,30,0.4));color:#ffffff;border:1px solid color-mix(in srgb,var(--cv-room-on,var(--accent)) 80%,transparent)}
.rsb-off{background:rgba(0,20,50,0.25);color:var(--cv-room-off,rgba(255,255,255,0.55));border:1px solid rgba(255,255,255,0.3)}
.rsb-offline{background:rgba(60,10,10,0.5);color:#f87171;border:1px solid rgba(248,113,113,0.5);animation:offlinePulse 2s ease-in-out infinite}
@keyframes offlinePulse{0%,100%{opacity:1}50%{opacity:0.55}}
.st-offline{font-size:13px;font-weight:700;color:#f87171;margin-top:2px;animation:offlinePulse 2s ease-in-out infinite}
.all-off-btn{
  margin:0 10px 6px;
  background:linear-gradient(145deg,rgba(220,38,38,0.82),rgba(185,18,18,0.88));
  border:1px solid rgba(255,120,120,0.55);
  border-radius:13px;padding:9px 12px;display:flex;align-items:center;gap:10px;
  cursor:pointer;outline:none;width:calc(100% - 20px);text-align:left;
  font-family:'Sora',sans-serif;
  box-shadow:
    0 6px 0 rgba(120,0,0,0.7),
    0 8px 16px rgba(220,38,38,0.45),
    0 2px 8px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,180,180,0.3),
    inset 0 -1px 0 rgba(0,0,0,0.25);
  transform:translateY(-3px);
  transition:transform 0.12s ease,box-shadow 0.12s ease,background 0.2s;
  position:relative;
  animation:allOffPulse 2.4s ease-in-out infinite;
}
@keyframes allOffPulse{
  0%,100%{box-shadow:0 6px 0 rgba(120,0,0,0.7),0 8px 16px rgba(220,38,38,0.45),0 2px 8px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,180,180,0.3),inset 0 -1px 0 rgba(0,0,0,0.25),0 0 0 0 rgba(220,38,38,0)}
  50%{box-shadow:0 6px 0 rgba(120,0,0,0.7),0 10px 28px rgba(220,38,38,0.65),0 2px 8px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,180,180,0.3),inset 0 -1px 0 rgba(0,0,0,0.25),0 0 22px 4px rgba(220,38,38,0.28)}
}
.all-off-btn:hover{
  background:linear-gradient(145deg,rgba(239,68,68,0.92),rgba(200,28,28,0.95));
  transform:translateY(-5px);
  box-shadow:
    0 8px 0 rgba(120,0,0,0.7),
    0 14px 32px rgba(220,38,38,0.6),
    0 3px 10px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,200,200,0.4),
    inset 0 -1px 0 rgba(0,0,0,0.25);
  animation:none;
}
.all-off-btn:active{
  transform:translateY(2px);
  box-shadow:
    0 2px 0 rgba(120,0,0,0.7),
    0 4px 10px rgba(220,38,38,0.35),
    0 1px 4px rgba(0,0,0,0.3),
    inset 0 2px 4px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,180,180,0.15);
  animation:none;
}
.all-off-ico{width:36px;height:36px;border-radius:50%;
  background:linear-gradient(145deg,rgba(255,100,100,0.35),rgba(200,20,20,0.4));
  border:1px solid rgba(255,150,150,0.5);
  display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;
  box-shadow:0 0 18px rgba(255,60,60,0.5),inset 0 1px 0 rgba(255,200,200,0.3)}
.all-off-info{flex:1}
.all-off-title{font-size:11px;font-weight:700;color:var(--cv-alloff-lbl,#ffe0e0);text-shadow:0 1px 6px rgba(255,60,60,0.6)}
.all-off-sub{font-size:8.5px;color:rgba(255,200,200,0.7);margin-top:1px}
.all-off-arr{color:rgba(255,180,180,0.75);font-size:18px;text-shadow:0 0 8px rgba(255,80,80,0.5)}
.bottom-row{display:flex;gap:8px}
.power-row{display:flex;align-items:center;gap:10px;
  background:linear-gradient(145deg,rgba(20,40,80,0.75),rgba(10,25,55,0.85));
  border:1px solid rgba(255,255,255,0.22);border-radius:18px;padding:12px 14px;
  cursor:pointer;outline:none;text-align:left;font-family:'Sora',sans-serif;flex:1.6;min-width:0;
  box-shadow:0 5px 0 rgba(0,0,0,0.55),0 7px 14px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.2);
  transform:translateY(-2px);
  transition:transform 0.12s ease,box-shadow 0.12s ease,background 0.15s}
.power-row:hover{
  background:linear-gradient(145deg,rgba(30,55,110,0.85),rgba(15,35,75,0.92));
  transform:translateY(-4px);
  box-shadow:0 7px 0 rgba(0,0,0,0.55),0 10px 22px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.2)}
.power-row:active{
  transform:translateY(1px);
  box-shadow:0 2px 0 rgba(0,0,0,0.55),0 3px 8px rgba(0,0,0,0.3),inset 0 2px 4px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.06)}
.timer-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  background:rgba(0,20,50,0.3);border:1px solid rgba(255,255,255,0.22);border-radius:18px;
  padding:10px 8px;cursor:pointer;outline:none;font-family:'Sora',sans-serif;
  transition:all 0.2s;flex:1;min-width:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;position:relative;overflow:visible}
@keyframes timerShake{0%,100%{transform:rotate(0deg) scale(1)}8%{transform:rotate(-18deg) scale(1.12)}16%{transform:rotate(16deg) scale(1.12)}24%{transform:rotate(-12deg) scale(1.08)}32%{transform:rotate(10deg) scale(1.06)}40%{transform:rotate(-6deg) scale(1.03)}50%{transform:rotate(5deg) scale(1.02)}60%,100%{transform:rotate(0deg) scale(1)}}
@keyframes timerGlow{0%,100%{filter:drop-shadow(0 0 3px rgba(251,191,36,0.4))}50%{filter:drop-shadow(0 0 10px rgba(251,191,36,0.9)) drop-shadow(0 0 20px rgba(251,191,36,0.5))}}
.timer-btn:hover{background:rgba(20,15,0,0.5);border-color:rgba(251,191,36,0.6);box-shadow:0 4px 18px rgba(251,191,36,0.25),inset 0 0 12px rgba(251,191,36,0.07)}
.timer-btn:hover .timer-ico{animation:timerShake 0.9s ease-in-out infinite,timerGlow 0.9s ease-in-out infinite;display:inline-block}
.timer-btn--active{border-color:rgba(251,191,36,0.75)!important;background:rgba(251,191,36,0.12)!important;box-shadow:0 0 14px rgba(251,191,36,0.2)}
.timer-ico{font-size:18px;line-height:1;pointer-events:none;transition:filter 0.2s}
.timer-lbl{font-size:7px;font-weight:700;letter-spacing:1px;color:var(--cv-timer-lbl,rgba(255,255,255,0.5));text-transform:uppercase;pointer-events:none}
.timer-cd{font-family:'Orbitron',sans-serif;font-size:10px;font-weight:600;color:rgba(251,191,36,0.9);line-height:1;min-height:13px;pointer-events:none}

/* ── Room tab tooltip ── */
.room-tab{position:relative}
.timer-popup{position:fixed;z-index:9999;
  background:rgba(6,10,24,0.98);backdrop-filter:blur(28px) saturate(1.8);-webkit-backdrop-filter:blur(28px) saturate(1.8);
  border:1px solid rgba(255,255,255,0.18);border-radius:20px;padding:15px 13px 13px;width:218px;
  box-shadow:0 8px 48px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.12)}
.tp-title{font-size:8px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.45);
  font-weight:700;text-align:center;margin-bottom:10px}
.tp-tabs{display:flex;gap:5px;margin-bottom:11px}
.tp-tab{flex:1;padding:7px 4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);
  border-radius:10px;font-size:9px;font-weight:700;font-family:'Sora',sans-serif;
  color:rgba(255,255,255,0.5);cursor:pointer;outline:none;transition:all 0.15s;text-align:center;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
.tp-tab-off-sel{background:rgba(251,191,36,0.18)!important;border-color:rgba(251,191,36,0.7)!important;color:#fbbf24!important}
.tp-tab-on-sel{background:rgba(52,211,153,0.18)!important;border-color:rgba(52,211,153,0.7)!important;color:#34d399!important}
.tp-hours{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:11px}
.tp-h{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.13);
  border-radius:9px;padding:7px 3px;font-size:10px;font-weight:600;font-family:'Orbitron',sans-serif;
  color:rgba(255,255,255,0.65);cursor:pointer;outline:none;transition:all 0.13s;text-align:center;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
.tp-h:hover{background:rgba(255,255,255,0.12);color:#fff}
.tp-h-off{background:rgba(251,191,36,0.22)!important;border-color:rgba(251,191,36,0.8)!important;color:#fbbf24!important;box-shadow:0 0 10px rgba(251,191,36,0.25)}
.tp-h-on{background:rgba(52,211,153,0.22)!important;border-color:rgba(52,211,153,0.8)!important;color:#34d399!important;box-shadow:0 0 10px rgba(52,211,153,0.25)}
.tp-acts{display:flex;gap:6px}
.tp-cancel{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);
  border-radius:9px;padding:8px;font-size:9px;font-weight:600;font-family:'Sora',sans-serif;
  color:rgba(255,255,255,0.55);cursor:pointer;outline:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
.tp-del{flex:1;background:rgba(255,60,60,0.08);border:1px solid rgba(255,80,80,0.25);
  border-radius:9px;padding:8px;font-size:9px;font-weight:600;font-family:'Sora',sans-serif;
  color:rgba(255,130,130,0.8);cursor:pointer;outline:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
.tp-ok{flex:1.3;border-radius:9px;padding:8px;font-size:9px;font-weight:700;font-family:'Sora',sans-serif;
  cursor:pointer;outline:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
.tp-ok-off{background:rgba(251,191,36,0.2);border:1px solid rgba(251,191,36,0.6);color:#fbbf24}
.tp-ok-on{background:rgba(52,211,153,0.2);border:1px solid rgba(52,211,153,0.6);color:#34d399}
.rt-header{font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:var(--cv-room-header,rgba(255,255,255,0.5));font-weight:600;margin-bottom:4px;margin-top:6px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.room-tabs{padding:0 10px 6px;display:flex;flex-direction:column;gap:4px;flex-shrink:0}
.room-tabs-inner{background:rgba(0,15,40,0.45);border:1px solid rgba(255,255,255,0.16);border-radius:14px;padding:7px;display:flex;flex-direction:column;gap:6px;box-shadow:0 4px 20px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.08)}
.room-tabs-inner.scrollable{max-height:calc(4 * 66px + 3 * 6px + 14px);overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.25) rgba(0,0,0,0.15)}
.room-tabs-inner.scrollable::-webkit-scrollbar{width:5px}
.room-tabs-inner.scrollable::-webkit-scrollbar-track{background:rgba(0,0,0,0.15);border-radius:4px}
.room-tabs-inner.scrollable::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.25);border-radius:4px}
.room-tab{display:flex;align-items:center;gap:8px;background:rgba(0,20,50,0.28);
  border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:12px 12px;min-height:58px;
  cursor:pointer;outline:none;text-align:left;transition:background 0.7s ease,border-color 0.2s,box-shadow 0.2s;width:100%;font-family:'Sora',sans-serif;overflow:hidden;box-sizing:border-box}
.room-tab--active.room-tab--on{border-color:color-mix(in srgb,var(--accent) 70%,transparent)!important;box-shadow:0 0 14px color-mix(in srgb,var(--accent) 30%,transparent)}
.room-tab--active.room-tab--off{border-color:rgba(251,191,36,0.5)!important}
.room-tab--running{border-color:color-mix(in srgb,var(--accent) 35%,rgba(255,255,255,0.2))!important}
.room-tab-ico{font-size:20px;line-height:1;flex-shrink:0;width:24px;text-align:center;display:flex;align-items:center;justify-content:center}
.room-tab-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.room-tab-name{font-size:12px;font-weight:600;color:var(--cv-room-name,rgba(255,255,255,0.9));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.room-tab-temp{font-family:'Orbitron',sans-serif;font-size:10px;font-weight:600;color:rgba(255,255,255,0.5)}
.room-tab-meta{font-size:9px;font-weight:500;color:rgba(255,255,255,0.42);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ── Super Lite mode ─────────────────────────────────────────────────────── */
.card--super-lite{display:flex;flex-direction:column;border-radius:22px;min-height:0;width:100%;box-sizing:border-box}
.sl-body{display:flex;flex-direction:column;padding:12px 14px 14px;gap:10px}
.sl-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.sl-title{font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.9);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.sl-badge{display:flex;align-items:center;gap:5px;background:rgba(0,20,50,0.32);border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:3px 10px 3px 6px}
.sl-led{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.sl-led-on{background:#34d399;box-shadow:0 0 8px #34d399;animation:blink 2.5s infinite}
.sl-led-off{background:#4b5563}
.sl-badge-txt{font-size:9px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:1px}
.sl-dial-wrap{display:flex;justify-content:center;position:relative;margin:-4px 0 -8px;transform:scale(1.12);transform-origin:center top}
.sl-dial-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-46%);
  display:flex;flex-direction:column;align-items:center;pointer-events:none;user-select:none;width:130px}
.sl-temp-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:500}
.sl-temp-val{font-family:'Orbitron',sans-serif;font-size:40px;font-weight:800;line-height:1;transition:color 0.6s ease}
.sl-temp-feel{font-size:10px;color:rgba(255,255,255,0.55);margin-top:4px;font-weight:300;text-align:center;max-width:120px;line-height:1.4}
.sl-temp-ctrl{display:flex;align-items:center;justify-content:center;gap:0}
.sl-temp-btn{width:36px;height:36px;border-radius:50%;background:rgba(0,20,50,0.28);
  border:1px solid rgba(255,255,255,0.22);color:rgba(255,255,255,0.9);font-size:22px;
  display:flex;align-items:center;justify-content:center;cursor:pointer;outline:none;transition:all 0.15s;font-family:'Sora',sans-serif}
.sl-temp-btn:hover{background:rgba(0,30,70,0.45);border-color:var(--accent);color:var(--accent)}
.sl-temp-btn:active{transform:scale(0.88)}
.sl-temp-set{min-width:88px;text-align:center;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:600;color:rgba(255,255,255,0.85)}
.sl-controls{display:flex;gap:8px;align-items:stretch}
.sl-mode-wrap{flex:0 0 30%;min-width:0;position:relative}
.sl-room-wrap{flex:1 1 0;min-width:0;position:relative}
.sl-mini-btn{width:100%;background:rgba(0,20,50,0.45);border:1px solid rgba(255,255,255,0.22);border-radius:10px;
  color:#fff;font-family:'Sora',sans-serif;font-size:10px;font-weight:600;
  padding:0 8px;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:space-between;gap:4px;
  transition:all 0.2s;white-space:nowrap;overflow:hidden;box-sizing:border-box;flex:1;min-height:28px}
.sl-mini-btn--inline{width:auto;flex:0 0 auto;min-width:0;max-width:72px;height:28px;border-radius:50px;padding:0 8px;justify-content:center;gap:3px;font-size:9px}
.sl-mini-btn--inline.sl-fan-inline{margin-right:6px}
.sl-mini-btn--inline.sl-swing-inline{margin-left:6px}
.sl-mini-btn:hover{border-color:rgba(255,255,255,0.45);background:rgba(0,30,70,0.55)}
.sl-mini-btn:active{transform:scale(0.94)}
.sl-mini-btn-ico{font-size:13px;line-height:1;flex-shrink:0}
.sl-mini-btn-val{flex:1;overflow:hidden;text-overflow:ellipsis;text-align:right;opacity:0.8}
.sl-select{width:100%;background:rgba(0,20,50,0.45);border:1px solid rgba(255,255,255,0.22);border-radius:12px;
  color:#ffffff;font-family:'Sora',sans-serif;font-size:11px;font-weight:600;
  padding:10px 10px 10px 10px;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.5)'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
  transition:all 0.2s;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}
.sl-select:hover{border-color:rgba(255,255,255,0.45);background-color:rgba(0,30,70,0.55)}
.sl-select option{background:#0a1a2e;color:#ffffff;font-size:12px}
.sl-select-lbl{font-size:8px;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.45);
  font-weight:700;margin-bottom:4px;padding-left:2px}
.sl-mode-active{border-color:color-mix(in srgb,var(--accent) 75%,transparent)!important;
  background-color:color-mix(in srgb,var(--accent) 15%,rgba(0,20,50,0.45))!important;
  box-shadow:0 0 14px color-mix(in srgb,var(--accent) 25%,transparent)}
/* ── Custom room dropdown ── */
.sl-room-btn{width:100%;background:rgba(0,20,50,0.45);border:1px solid rgba(255,255,255,0.22);border-radius:12px;
  color:#ffffff;font-family:'Sora',sans-serif;font-size:11px;font-weight:600;
  padding:10px 28px 10px 10px;cursor:pointer;outline:none;
  display:flex;align-items:center;justify-content:space-between;gap:4px;
  transition:all 0.2s;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;
  position:relative;box-sizing:border-box}
.sl-room-btn:hover{border-color:rgba(255,255,255,0.45);background-color:rgba(0,30,70,0.55)}
.sl-room-btn-txt{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.sl-room-btn-arrow{flex-shrink:0;width:10px;height:6px;opacity:0.5;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1)}
.sl-room-btn-arrow.open{transform:rotate(180deg)}
/* Overlay backdrop so the blur renders correctly on every platform */
.sl-room-overlay{position:fixed;inset:0;z-index:9990;background:transparent}
/* Bubble burst: the scale overshoots 1 then settles — like the iOS spring */
@keyframes slBubblePop{
  0%  {opacity:0;transform:scale(0.5) translateY(-10px);filter:blur(8px)}
  60% {opacity:1;transform:scale(1.04) translateY(2px);filter:blur(0)}
  80% {transform:scale(0.98) translateY(0)}
  100%{transform:scale(1)   translateY(0)}
}
.sl-room-item{display:flex;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;
  cursor:pointer;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);
  transition:background 0.13s,transform 0.1s;white-space:nowrap;
  /* Stagger animation for each item */
  animation:slItemIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both}
.sl-room-item:nth-child(1){animation-delay:0.04s}
.sl-room-item:nth-child(2){animation-delay:0.08s}
.sl-room-item:nth-child(3){animation-delay:0.12s}
.sl-room-item:nth-child(4){animation-delay:0.16s}
.sl-room-item:nth-child(5){animation-delay:0.20s}
.sl-room-item:nth-child(6){animation-delay:0.24s}
.sl-room-item:nth-child(7){animation-delay:0.28s}
.sl-room-item:nth-child(8){animation-delay:0.32s}
@keyframes slItemIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.sl-room-item:hover{background:rgba(255,255,255,0.1);transform:scale(1.01)}
.sl-room-item:active{transform:scale(0.97)}
.sl-room-item.active{background:linear-gradient(90deg,rgba(59,130,246,0.22),rgba(139,92,246,0.14));color:#fff;
  box-shadow:inset 0 0 0 1px rgba(99,179,237,0.2)}
.sl-room-item-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;flex-shrink:0;letter-spacing:0.5px}
.sl-room-item-badge.on{background:rgba(52,211,153,0.2);color:#34d399;box-shadow:0 0 8px rgba(52,211,153,0.3)}
.sl-room-item-badge.off{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.35)}
.sl-room-item-badge.offline{background:rgba(248,113,113,0.15);color:#f87171;border:1px solid rgba(248,113,113,0.4);animation:offlinePulse 2s ease-in-out infinite}


/* ======================================================
   DEEP NEON THEME  -  modern, layered, glassmorphism
   ====================================================== */
.card--deep-neon{
  background:linear-gradient(160deg,#020b18 0%,#041428 35%,#061c35 65%,#030e1f 100%) !important;
  border:1px solid rgba(0,180,255,0.18) !important;
  box-shadow:
    0 0 0 1px rgba(0,212,255,0.12),
    0 0 40px rgba(0,120,220,0.18),
    0 40px 120px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(0,212,255,0.15),
    inset 0 -1px 0 rgba(0,80,180,0.08) !important;
  position:relative;overflow:hidden;
}
.card--deep-neon .left{
  background:linear-gradient(160deg,rgba(0,30,70,0.55) 0%,rgba(0,15,45,0.35) 100%) !important;
  border-right:1px solid rgba(0,180,255,0.14) !important;
}
.card--deep-neon .left::before{
  background:radial-gradient(circle,rgba(0,180,255,0.18) 0%,transparent 65%) !important;
  opacity:0.8 !important;
  width:500px !important;height:500px !important;
}
.card--deep-neon .hdr-ico{
  background:linear-gradient(135deg,rgba(0,180,255,0.9),rgba(0,80,200,0.8)) !important;
  box-shadow:0 4px 24px rgba(0,180,255,0.5),0 0 40px rgba(0,120,255,0.25) !important;
}
.card--deep-neon .hdr-title{color:rgba(180,230,255,0.95) !important;letter-spacing:2.5px}
.card--deep-neon .greet-name{
  color:#ffffff !important;
  text-shadow:0 0 20px rgba(0,200,255,0.5),0 0 40px rgba(0,150,255,0.25);
}
.card--deep-neon .dial-wrap{filter:drop-shadow(0 0 24px rgba(0,180,255,0.3))}
.card--deep-neon .sl-dial-wrap{filter:drop-shadow(0 0 24px rgba(0,180,255,0.3))}
.card--deep-neon .dial-temp,.card--deep-neon .sl-temp-val{filter:drop-shadow(0 0 12px currentColor)}
.card--deep-neon .temp-btn,.card--deep-neon .sl-temp-btn{
  background:rgba(0,30,80,0.6) !important;
  border:1px solid rgba(0,180,255,0.3) !important;
  box-shadow:0 0 10px rgba(0,120,255,0.15);
}
.card--deep-neon .temp-btn:hover,.card--deep-neon .sl-temp-btn:hover{
  background:rgba(0,60,140,0.7) !important;
  border-color:rgba(0,212,255,0.7) !important;
  box-shadow:0 0 20px rgba(0,180,255,0.4) !important;
}
.card--deep-neon .mode-btn{
  background:rgba(0,20,60,0.55) !important;
  border:1px solid rgba(0,160,255,0.18) !important;
}
.card--deep-neon .mode-btn:hover{background:rgba(0,40,100,0.7) !important;border-color:rgba(0,200,255,0.45) !important}
.card--deep-neon .right{background:linear-gradient(160deg,rgba(0,20,55,0.45) 0%,rgba(0,10,35,0.3) 100%) !important}
.card--deep-neon .room-image::after{
  background:linear-gradient(to bottom,rgba(2,11,24,0.05) 0%,rgba(2,11,24,0) 15%,rgba(2,11,24,0.5) 55%,rgba(2,11,24,0.88) 78%,rgba(2,11,24,1) 100%) !important;
}
.card--deep-neon .status-block{background:rgba(0,20,55,0.55) !important;border:1px solid rgba(0,160,255,0.15) !important}
.card--deep-neon .room-tab{border:1px solid rgba(0,160,255,0.12) !important}
.card--deep-neon .room-tab:not([style]){background:rgba(0,20,55,0.55)}
.card--deep-neon .room-tab--active{
  border-color:rgba(0,200,255,0.4) !important;
  box-shadow:0 0 16px rgba(0,180,255,0.2) !important;
}
.card--deep-neon .room-tab--active:not([style]){background:rgba(0,40,100,0.65)}
.card--deep-neon .power-row{background:rgba(0,25,65,0.6) !important;border:1px solid rgba(0,160,255,0.18) !important}
.card--deep-neon .rt-header{color:rgba(0,200,255,0.7) !important}
.card--deep-neon .rt-header::before,.card--deep-neon .rt-header::after{
  background:linear-gradient(90deg,transparent,rgba(0,180,255,0.5),transparent) !important;
}
.card--deep-neon .ac-overlay{
  background:rgba(2,11,24,0.75) !important;
  border:1px solid rgba(0,180,255,0.2) !important;
  box-shadow:0 4px 20px rgba(0,0,0,0.5),0 0 20px rgba(0,100,255,0.15) !important;
}
.card--deep-neon.card--super-lite{
  border:1px solid rgba(0,180,255,0.2) !important;
  box-shadow:0 0 0 1px rgba(0,212,255,0.1),0 0 60px rgba(0,100,220,0.2),0 30px 80px rgba(0,0,0,0.55),inset 0 1px 0 rgba(0,212,255,0.18) !important;
}
.card--deep-neon .sl-badge{background:rgba(0,25,65,0.7) !important;border:1px solid rgba(0,180,255,0.25) !important}
.card--deep-neon .sl-select,.card--deep-neon .sl-room-btn{
  background:rgba(0,20,60,0.65) !important;
  border:1px solid rgba(0,160,255,0.22) !important;
}
.card--deep-neon .sl-select:hover,.card--deep-neon .sl-room-btn:hover{
  background:rgba(0,40,100,0.75) !important;
  border-color:rgba(0,212,255,0.55) !important;
  box-shadow:0 0 14px rgba(0,180,255,0.25) !important;
}
.card--deep-neon .room-tabs-inner{background:rgba(0,15,45,0.55) !important;border:1px solid rgba(0,160,255,0.12) !important}
.card--deep-neon .all-off-btn{background:rgba(30,0,0,0.4) !important;border:1px solid rgba(255,80,80,0.2) !important}
.card--deep-neon::before{
  content:'';position:absolute;inset:0;pointer-events:none;border-radius:28px;z-index:0;
  background:
    radial-gradient(ellipse 80% 40% at 50% -5%,rgba(0,180,255,0.09) 0%,transparent 65%),
    radial-gradient(ellipse 50% 25% at 85% 105%,rgba(60,0,255,0.06) 0%,transparent 65%),
    radial-gradient(ellipse 30% 20% at 15% 80%,rgba(0,100,255,0.05) 0%,transparent 70%);
}
.card--deep-neon>*{position:relative;z-index:1}
.card--deep-neon .left::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(0,180,255,0.3),transparent);
  pointer-events:none;
}

/* -- Auto-scale responsive wrapper -- */
.card-scale-wrap{width:100%;overflow:hidden;border-radius:22px;box-sizing:border-box}
.card-scale-wrap>.card,.card-scale-wrap>.card--super-lite{transform-origin:top left}
`;

class AcControllerCardV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._activeIdx   = 0;
    this._hass        = null;
    this._clockInt    = null;
    this._refreshInt  = null;   // 10s interval that refreshes the live temperature + ETA
    this._acTip       = null;   // tooltip element appended to document.body
    this._initialized = false;
    // timers: map roomIdx → { end, mode, hrs, int }
    this._timers           = {};
    this._outsideHandler   = null;
    this._confirmJustOpened = false;
    this._popupJustOpened  = false;
    // Temperature history used to derive the cooling rate: map roomIdx → [{t, temp}, ...]
    this._tempHistory      = {};
    // Restore tempHistory from localStorage (survives a reload)
    try {
      var savedHist = localStorage.getItem('ac_temp_history_v2');
      if (savedHist) {
        var th = JSON.parse(savedHist);
        var nowH = Date.now();
        var selfH = this;
        // Keep only the points from the last 30 minutes
        Object.keys(th).forEach(function(idx) {
          var pts = th[idx].filter(function(p) { return (nowH - p.t) < 30 * 60 * 1000; });
          if (pts.length > 0) selfH._tempHistory[idx] = pts;
        });
      }
    } catch(e) {}
    // Restore lastHvacMode from localStorage (survives a reload and other devices)
    this._lastHvacMode = {};
    try {
      var savedHvac = localStorage.getItem('ac_last_hvac_mode_v1');
      if (savedHvac) this._lastHvacMode = JSON.parse(savedHvac) || {};
    } catch(e) {}

    // Restore the timers from localStorage after a page reload
    try {
      var saved = localStorage.getItem('ac_timer_state_v2');
      if (saved) {
        var ts = JSON.parse(saved);
        var now0 = Date.now();
        var self0 = this;
        Object.keys(ts).forEach(function(idx) {
          var t = ts[idx];
          if (t.end && t.end > now0) {
            self0._timers[idx] = { end: t.end, mode: t.mode || 'off', hrs: t.hrs || null, int: null };
          }
        });
      }
    } catch(e) {}
  }

  // ── FIX: compare the state before rendering ──────────────────────────────────
  set hass(h) {
    var prev = this._hass;
    this._hass = h;

    // The UI language follows HA. On the first assignment -- and again if the
    // user switches their HA profile language -- the localised placeholder room
    // names have to be rebuilt before anything renders. Configured room labels
    // are user text and are never touched by this.
    var wantLang = acLangFromHass(h);
    if (!this._config) this._config = Object.assign({}, AC_DEFAULT_CONFIG);
    var langChanged = this._config.language !== wantLang;
    if (langChanged) {
      this._config.language = wantLang;
      this._buildRooms(wantLang);
    }

    // First time through -> a full render is required. So is a language change:
    // every string in the card comes from the translation table, and the
    // "did the room state change" test below cannot see it.
    if (!this._initialized || langChanged) {
      this._renderFull();
      return;
    }

    // Only re-render when the selected room's state actually changes
    var id = ROOMS[this._activeIdx].id;
    var changed = !prev
      || this._stateOf(h, id)   !== this._stateOf(prev, id)
      || this._attrOf(h, id, 'temperature')         !== this._attrOf(prev, id, 'temperature')
      || this._attrOf(h, id, 'current_temperature') !== this._attrOf(prev, id, 'current_temperature')
      || this._attrOf(h, id, 'fan_mode')            !== this._attrOf(prev, id, 'fan_mode')
      || this._attrOf(h, id, 'swing_mode')          !== this._attrOf(prev, id, 'swing_mode')
      || this._attrOf(h, id, 'swing_horizontal_mode') !== this._attrOf(prev, id, 'swing_horizontal_mode')
      || this._attrOf(h, id, 'preset_mode')         !== this._attrOf(prev, id, 'preset_mode');

    // A quick switch belongs to the active room, so its state is part of the
    // "did anything visible change" test.
    // NOTE: `cfg` does NOT exist in this scope -- the config lives on
    // this._config. Referring to cfg here only blew up when the room state
    // was unchanged and this branch was finally reached.
    if (!changed && this._config && this._config.quick_switches !== false) {
      var _qsList = ((this._config.entities && this._config.entities[this._activeIdx]) || {}).quick_switches || [];
      if (Array.isArray(_qsList)) {
        for (var _q2 = 0; _q2 < _qsList.length; _q2++) {
          var _qe = _qsList[_q2];
          var _qid = (typeof _qe === 'string') ? _qe : (_qe && (_qe.entity_id || _qe.switch || _qe.id));
          if (!_qid) continue;
          if (this._stateOf(h, _qid) !== this._stateOf(prev, _qid)) { changed = true; break; }
        }
      }
    }

    // Also check the ON/OFF badge of every room (for the room tabs)
    if (!changed) {
      for (var i = 0; i < ROOMS.length; i++) {
        if (this._stateOf(h, ROOMS[i].id) !== this._stateOf(prev, ROOMS[i].id)) {
          changed = true;
          break;
        }
      }
    }

    // FIX v1.5.1: also check the individual sensor entities (temp, humidity, power, outdoor, PM2.5)
    // These used to be missed → the card did not refresh when a sensor changed, forcing a page reload
    if (!changed && prev) {
      var cfg = this._config || {};
      // Global sensors
      var globalSensors = [
        cfg.outdoor_temp_entity,
        // Both names: the resolver reads outdoor_humidity_entity, and watching
        // only the legacy key meant a change to the new one never re-rendered.
        cfg.outdoor_humidity_entity,
        cfg.humidity_entity,
        cfg.power_entity,
        cfg.pm25_entity,
      ];
      for (var gi = 0; gi < globalSensors.length; gi++) {
        var gEnt = globalSensors[gi];
        if (gEnt) {
          var gNew = h.states && h.states[gEnt] ? h.states[gEnt].state : null;
          var gOld = prev.states && prev.states[gEnt] ? prev.states[gEnt].state : null;
          if (gNew !== gOld) { changed = true; break; }
        }
      }
    }
    if (!changed && prev) {
      // Per-room sensors (temp_entity, humidity_entity, power_entity for each room)
      var ents = (this._config && this._config.entities) || [];
      for (var ei = 0; ei < ROOMS.length && !changed; ei++) {
        var roomSensors = [
          ents[ei] && ents[ei].temp_entity,
          ents[ei] && ents[ei].humidity_entity,
          ents[ei] && ents[ei].power_entity,
        ];
        for (var si = 0; si < roomSensors.length; si++) {
          var sEnt = roomSensors[si];
          if (sEnt) {
            var sNew = h.states && h.states[sEnt] ? h.states[sEnt].state : null;
            var sOld = prev.states && prev.states[sEnt] ? prev.states[sEnt].state : null;
            if (sNew !== sOld) { changed = true; break; }
          }
        }
        // Damper entities (Central AC)
        if (!changed && ents[ei] && ents[ei].is_central_ac) {
          var dmpsChk = ents[ei].dampers || [];
          for (var dci = 0; dci < dmpsChk.length; dci++) {
            var dcEnt = dmpsChk[dci] && dmpsChk[dci].entity_id;
            if (dcEnt) {
              var dcNew = h.states && h.states[dcEnt] ? h.states[dcEnt].state : null;
              var dcOld = prev.states && prev.states[dcEnt] ? prev.states[dcEnt].state : null;
              var dcPosNew = h.states && h.states[dcEnt] && h.states[dcEnt].attributes ? h.states[dcEnt].attributes.current_position : null;
              var dcPosOld = prev.states && prev.states[dcEnt] && prev.states[dcEnt].attributes ? prev.states[dcEnt].attributes.current_position : null;
              if (dcNew !== dcOld || dcPosNew !== dcPosOld) { changed = true; break; }
            }
          }
        }
      }
    }

    // ── Central AC safety: auto-off when every damper is closed ─────────────────
    if (prev && h) {
      var cfgCA = this._config || {};
      var entsCA = cfgCA.entities || [];
      for (var cai = 0; cai < ROOMS.length; cai++) {
        var roomCfgCA = entsCA[cai] || {};
        if (!roomCfgCA.is_central_ac) continue;
        var dmpsCA = roomCfgCA.dampers || [];
        if (!dmpsCA.length) continue;
        var roomIdCA = ROOMS[cai].id;
        var roomStateCA = h.states && h.states[roomIdCA] ? h.states[roomIdCA].state : 'off';
        if (roomStateCA === 'off' || roomStateCA === 'unavailable' || roomStateCA === 'unknown') continue;
        // Check whether every damper is closed
        var allClosedCA = dmpsCA.every(function(d) {
          if (!d || !d.entity_id) return true;
          var dst = h.states && h.states[d.entity_id];
          return !dst || (parseFloat(dst.attributes && dst.attributes.current_position) || 0) === 0;
        });
        if (allClosedCA) {
          // Turn the AC off to protect the piping
          this._call('climate', 'set_hvac_mode', { entity_id: roomIdCA, hvac_mode: 'off' });
        }
      }
    }

    if (changed) {
      // ── Record temperature history per room ──────────────────────────────
      var nowMs = Date.now();
      var histDirty = false;
      for (var ri = 0; ri < ROOMS.length; ri++) {
        var rid = ROOMS[ri].id;
        var rTemp = parseFloat(this._attrOf(h, rid, 'current_temperature'));
        var rMode = this._stateOf(h, rid);
        if (!isNaN(rTemp) && rMode === 'cool') {
          if (!this._tempHistory[ri]) this._tempHistory[ri] = [];
          var hist = this._tempHistory[ri];
          var last = hist[hist.length - 1];
          if (!last || Math.abs(last.temp - rTemp) >= 0.05 || (nowMs - last.t) >= 30000) {
            hist.push({ t: nowMs, temp: rTemp });
            if (hist.length > 30) hist.splice(0, hist.length - 30);
            histDirty = true;
          }
        } else if (rMode !== 'cool') {
          // Only clear it once actually off / mode changed (not right after power-on)
          if (this._tempHistory[ri] && this._tempHistory[ri].length > 0) {
            this._tempHistory[ri] = [];
            histDirty = true;
          }
        }
      }
      // Persist the history to localStorage so it survives a reload
      if (histDirty) {
        try { localStorage.setItem('ac_temp_history_v2', JSON.stringify(this._tempHistory)); } catch(e) {}
      }
      // Do not rebuild the SVG while a ring is being dragged -- the inner ring
      // would re-render to the new setTemp and the gesture would lose the node
      // it is bound to. The Full/Lite drag state used to be a closure local in
      // _bind() and invisible here, so only Super Lite was protected: any
      // tracked change mid-drag replaced the SVG and the 300ms debounce then
      // committed whatever value was live at that moment, not the one the
      // user dragged to.
      if (!this._slDragging && !this._dialDragging) {
        this._renderFull();
      }
    }
  }

  // Helpers to read state/attributes safely from any hass object
  _stateOf(hassObj, id) {
    // Return the real state (including 'unavailable') instead of masking it as 'off'
    return hassObj && hassObj.states && hassObj.states[id] ? hassObj.states[id].state : 'unavailable';
  }
  _attrOf(hassObj, id, k) {
    return hassObj && hassObj.states && hassObj.states[id] && hassObj.states[id].attributes
      ? hassObj.states[id].attributes[k]
      : null;
  }

  // ── Compute the cooling ETA ────────────────────────────────────────────────────
  // Returns { eta: minutes, rate: number, mode: 'measured'|'estimated' } or null
  // ── Cool Mode Trail Animation ─────────────────────────────────────────────
  // Snowflakes + a light trail from the cool button → dial centre + a water-droplet burst
  // Repeat every 10 seconds while in cool mode
  // ── Cool Trail Animation ─────────────────────────────────────────────────
  // Architecture: one single RAF loop runs continuously, independent of DOM re-renders.
  // The canvas is attached to document.body (position:fixed), so innerHTML wipes do not kill it.
  // _coolAnimRunning: master flag; _coolAnimPhase: 'trail'|'burst'|'wait'
  // All state lives in the this._cas (cool anim state) object.

  _startCoolTrailAnim() {
    if (this._coolAnimRunning) return;
    this._coolAnimRunning = true;
    this._cas = null;          // reset state
    this._coolAnimRaf = requestAnimationFrame(this._coolAnimLoop.bind(this));
  }

  _stopCoolTrailAnim() {
    this._coolAnimRunning = false;
    if (this._coolAnimRaf) { cancelAnimationFrame(this._coolAnimRaf); this._coolAnimRaf = null; }
    this._cas = null;
    // Clear the canvas
    var c = document.getElementById('cool-trail-global-canvas');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  _coolAnimLoop(ts) {
    // Stopped -> leave the loop
    if (!this._coolAnimRunning) return;

    var self = this;
    var cas  = this._cas;

    // ── Initialise the state on first run or after every wait cycle ─────────────────
    if (!cas) {
      // Check that cool mode is still active
      var room = ROOMS[this._activeIdx];
      var hvac = room && this._hass && this._hass.states && this._hass.states[room.id]
        ? (this._hass.states[room.id].attributes && this._hass.states[room.id].attributes.hvac_mode)
          || this._hass.states[room.id].state
        : null;
      if (hvac !== 'cool') { this._coolAnimRunning = false; return; }

      // Locate the button and the dial inside the shadow root
      var sr = this.shadowRoot;
      if (!sr) { this._coolAnimRunning = false; return; }
      var dialWrap = sr.getElementById('dial-wrap-main');
      var coolBtn  = sr.querySelector('.mode-btn[data-hvac="cool"]');
      if (!dialWrap || !coolBtn) {
        // DOM is not ready yet, retry in 200ms
        this._coolAnimRaf = setTimeout(function() {
          if (self._coolAnimRunning) self._coolAnimRaf = requestAnimationFrame(self._coolAnimLoop.bind(self));
        }, 200);
        return;
      }

      // Real viewport coordinates (getBoundingClientRect is unaffected by the scale)
      var btnR  = coolBtn.getBoundingClientRect();
      var dialR = dialWrap.getBoundingClientRect();

      // Make sure the canvas exists and is the right size
      var canvas = document.getElementById('cool-trail-global-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'cool-trail-global-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
        document.body.appendChild(canvas);
      }
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      var repeatMs = Math.min(15000, Math.max(2000,
        (this._config && this._config.cool_anim_speed) || 10000));

      this._cas = cas = {
        canvas      : canvas,
        ctx         : canvas.getContext('2d'),
        // Origin: top edge of the cool button, horizontally centred
        sx          : btnR.left + btnR.width / 2,
        sy          : btnR.top - 10,
        // Target: dial centre
        ex          : dialR.left + dialR.width  / 2,
        ey          : dialR.top  + dialR.height / 2,
        phase       : 'trail',    // 'trail' | 'burst' | 'wait'
        phaseStart  : ts,
        phaseDur    : 2000,       // trail fixed at 2s
        burstDur    : 1500,       // burst fixed at 1.5s
        repeatMs    : repeatMs,
        waitStart   : 0,
        flakeRot    : [0,0.5,1,1.5,2],
      };
    }

    var ctx    = cas.ctx;
    var canvas = cas.canvas;
    var sx = cas.sx, sy = cas.sy, ex = cas.ex, ey = cas.ey;
    var W = canvas.width, H = canvas.height;

    // ── Clamp elapsed so a hidden/reshown tab or a jumping RAF timestamp cannot skip a phase ──
    var elapsed = ts - cas.phaseStart;
    var maxStep = 100; // max ms per frame — if exceeded, reset phaseStart
    if (!cas._lastTs) cas._lastTs = ts;
    var frameDelta = ts - cas._lastTs;
    cas._lastTs = ts;
    if (frameDelta > 200) {
      // Tab just regained focus — reset phaseStart to avoid a skip
      cas.phaseStart = ts - Math.min(elapsed, cas.phase === 'trail' ? cas.phaseDur - 50 : cas.phase === 'burst' ? cas.burstDur - 50 : 0);
      elapsed = ts - cas.phaseStart;
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    function lerp(a,b,t)   { return a+(b-a)*t; }
    function eio(t)        { return t<0.5?2*t*t:-1+(4-2*t)*t; }
    function eoc(t)        { return 1-Math.pow(1-t,3); }

    function flake(x, y, size, rot, alpha) {
      if (alpha<=0||size<1) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1,alpha);
      ctx.translate(x,y); ctx.rotate(rot);
      ctx.strokeStyle='#c8e8ff';
      ctx.lineWidth=Math.max(1,size*0.15);
      ctx.lineCap='round';
      ctx.shadowColor='#3b9eff'; ctx.shadowBlur=size*1.4;
      for (var a=0;a<6;a++) {
        ctx.save(); ctx.rotate(a*Math.PI/3);
        ctx.beginPath();
        ctx.moveTo(0,0);          ctx.lineTo(0,-size);
        ctx.moveTo(0,-size*.5);   ctx.lineTo(-size*.25,-size*.72);
        ctx.moveTo(0,-size*.5);   ctx.lineTo( size*.25,-size*.72);
        ctx.moveTo(0,-size*.25);  ctx.lineTo(-size*.15,-size*.4);
        ctx.moveTo(0,-size*.25);  ctx.lineTo( size*.15,-size*.4);
        ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }

    ctx.clearRect(0, 0, W, H);

    var elapsed = ts - cas.phaseStart;

    if (cas.phase === 'trail') {
      var tp   = Math.min(elapsed / cas.phaseDur, 1);
      var head = eio(tp);

      // Trail gradient
      var tailStart = Math.max(0, head - 0.5);
      var tx1=lerp(sx,ex,tailStart), ty1=lerp(sy,ey,tailStart);
      var tx2=lerp(sx,ex,head),      ty2=lerp(sy,ey,head);
      if (Math.hypot(tx2-tx1,ty2-ty1) > 1) {
        var gr = ctx.createLinearGradient(tx1,ty1,tx2,ty2);
        gr.addColorStop(0,  'rgba(59,158,255,0)');
        gr.addColorStop(0.4,'rgba(80,170,255,0.35)');
        gr.addColorStop(1,  'rgba(200,232,255,0.9)');
        ctx.save();
        ctx.strokeStyle=gr; ctx.lineWidth=4; ctx.lineCap='round';
        ctx.shadowColor='#3b9eff'; ctx.shadowBlur=18;
        ctx.beginPath(); ctx.moveTo(tx1,ty1); ctx.lineTo(tx2,ty2); ctx.stroke();
        ctx.restore();
      }

      // Glow at the trail head
      var hx=lerp(sx,ex,head), hy=lerp(sy,ey,head);
      var hg=ctx.createRadialGradient(hx,hy,0,hx,hy,20);
      hg.addColorStop(0,'rgba(210,240,255,0.95)');
      hg.addColorStop(0.5,'rgba(59,158,255,0.5)');
      hg.addColorStop(1,'rgba(59,158,255,0)');
      ctx.save(); ctx.fillStyle=hg;
      ctx.beginPath(); ctx.arc(hx,hy,20,0,Math.PI*2); ctx.fill(); ctx.restore();

      // Small snowflakes along the trail
      for (var fi=0;fi<5;fi++) {
        var fPos=(fi/5)*head;
        if (fPos<0.02) continue;
        var fx=lerp(sx,ex,fPos), fy=lerp(sy,ey,fPos);
        var fA=0.45+0.45*(fPos/Math.max(head,0.01));
        cas.flakeRot[fi]+=0.012;
        flake(fx,fy,5+fi*2,cas.flakeRot[fi],fA);
      }
      // Large snowflake at the head
      flake(hx, hy, 17, elapsed*0.0014, 1.0);

      // Advance the phase
      if (elapsed >= cas.phaseDur) {
        cas.phase = 'burst';
        cas.phaseStart = ts;
      }

    } else if (cas.phase === 'burst') {
      var bp = Math.min(elapsed / cas.burstDur, 1);
      var bE = eoc(bp);

      // Flash
      var fA2 = Math.max(0, 1-bp*5);
      if (fA2 > 0) {
        var fg=ctx.createRadialGradient(ex,ey,0,ex,ey,60);
        fg.addColorStop(0,'rgba(235,248,255,'+fA2.toFixed(2)+')');
        fg.addColorStop(0.5,'rgba(59,158,255,'+(fA2*0.7).toFixed(2)+')');
        fg.addColorStop(1,'rgba(59,158,255,0)');
        ctx.save(); ctx.fillStyle=fg;
        ctx.beginPath(); ctx.arc(ex,ey,60,0,Math.PI*2); ctx.fill(); ctx.restore();
      }

      // The glow spreads
      var gA=Math.max(0,0.8-bp*0.9), gR=45+bE*90;
      var cg=ctx.createRadialGradient(ex,ey,0,ex,ey,gR);
      cg.addColorStop(0,'rgba(190,235,255,'+(gA*0.95).toFixed(2)+')');
      cg.addColorStop(0.35,'rgba(59,158,255,'+(gA*0.65).toFixed(2)+')');
      cg.addColorStop(1,'rgba(59,158,255,0)');
      ctx.save(); ctx.fillStyle=cg;
      ctx.beginPath(); ctx.arc(ex,ey,gR,0,Math.PI*2); ctx.fill(); ctx.restore();

      // 10 water droplets
      for (var d=0;d<10;d++) {
        var ang=(d/10)*Math.PI*2+0.3;
        var dD=bE*70, dA=Math.max(0,1-bp*1.1);
        var dX=ex+Math.cos(ang)*dD, dY=ey+Math.sin(ang)*dD;
        var dS=(1-bE*0.55)*8;
        ctx.save(); ctx.globalAlpha=dA;
        ctx.translate(dX,dY); ctx.rotate(ang+Math.PI/2);
        ctx.beginPath();
        ctx.moveTo(0,-dS*1.6);
        ctx.bezierCurveTo(dS,0,dS,dS,0,dS*1.3);
        ctx.bezierCurveTo(-dS,dS,-dS,0,0,-dS*1.6);
        ctx.fillStyle='rgba(120,210,255,0.92)';
        ctx.shadowColor='#3b9eff'; ctx.shadowBlur=12;
        ctx.fill(); ctx.restore();
      }

      // Big snowflake at the centre
      flake(ex,ey, 14+bE*18, bp*Math.PI*0.4, Math.max(0,1-bp*1.2));

      // Tiny ice shard
      for (var s=0;s<6;s++) {
        var sA2=(s/6)*Math.PI*2+Math.PI/6;
        var sD=bE*48;
        flake(ex+Math.cos(sA2)*sD, ey+Math.sin(sA2)*sD, 4+s*1.5, bp*2+s, Math.max(0,0.75-bp));
      }

      // Switch to the wait phase
      if (elapsed >= cas.burstDur) {
        ctx.clearRect(0, 0, W, H);
        cas.phase    = 'wait';
        cas.phaseStart = ts;
        cas.waitStart  = ts;
      }

    } else if (cas.phase === 'wait') {
      // Wait repeatMs, then reset the state so it can run again
      if (elapsed >= cas.repeatMs) {
        this._cas = null;   // reset → the next loop iteration re-initialises the coordinates
      }
      // The canvas stays blank while waiting → nothing is drawn
    }

    // Continue the loop
    this._coolAnimRaf = requestAnimationFrame(this._coolAnimLoop.bind(this));
  }


  // ── Fan Mode Wind Animation ───────────────────────────────────────────────
  // Wind streams from the fan_only button → dial centre → a swirl that grows and then fades out
  // Same architecture as the cool trail: a fixed canvas on the body, an independent RAF loop

  _startFanWindAnim() {
    if (this._fanAnimRunning) return;
    this._fanAnimRunning = true;
    this._fas = null;
    this._fanAnimRaf = requestAnimationFrame(this._fanAnimLoop.bind(this));
  }

  _stopFanWindAnim() {
    this._fanAnimRunning = false;
    if (this._fanAnimRaf) { cancelAnimationFrame(this._fanAnimRaf); this._fanAnimRaf = null; }
    this._fas = null;
    var c = document.getElementById('fan-wind-global-canvas');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  _fanAnimLoop(ts) {
    if (!this._fanAnimRunning) return;

    var self = this;
    var fas  = this._fas;

    // ── Initialise the state ────────────────────────────────────────────────────
    if (!fas) {
      var room = ROOMS[this._activeIdx];
      var hvac = room && this._hass && this._hass.states && this._hass.states[room.id]
        ? (this._hass.states[room.id].attributes && this._hass.states[room.id].attributes.hvac_mode)
          || this._hass.states[room.id].state
        : null;
      if (hvac !== 'fan_only') { this._fanAnimRunning = false; return; }

      var sr = this.shadowRoot;
      if (!sr) { this._fanAnimRunning = false; return; }
      var dialWrap = sr.getElementById('dial-wrap-main');
      var fanBtn   = sr.querySelector('.mode-btn[data-hvac="fan_only"]');
      if (!dialWrap || !fanBtn) {
        this._fanAnimRaf = setTimeout(function() {
          if (self._fanAnimRunning) self._fanAnimRaf = requestAnimationFrame(self._fanAnimLoop.bind(self));
        }, 200);
        return;
      }

      var btnR  = fanBtn.getBoundingClientRect();
      var dialR = dialWrap.getBoundingClientRect();

      var canvas = document.getElementById('fan-wind-global-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'fan-wind-global-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99998;';
        document.body.appendChild(canvas);
      }
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      var repeatMs = Math.min(15000, Math.max(2000,
        (this._config && this._config.cool_anim_speed) || 10000));

      // Generate the wind streams — each offset slightly so they look natural
      var streams = [];
      for (var i = 0; i < 5; i++) {
        streams.push({
          offset  : (i - 2) * 6,   // horizontal offset from the main axis (px)
          delay   : i * 120,        // start delay (ms)
          width   : 2 + i * 0.6,
          alpha   : 0.55 + i * 0.06,
        });
      }

      this._fas = fas = {
        canvas    : canvas,
        ctx       : canvas.getContext('2d'),
        sx        : btnR.left + btnR.width  / 2,
        sy        : btnR.top  + btnR.height / 2,
        ex        : dialR.left + dialR.width  / 2,
        ey        : dialR.top  + dialR.height / 2,
        phase     : 'trail',   // 'trail' | 'vortex' | 'wait'
        phaseStart: ts,
        trailDur  : 1800,
        vortexDur : 2200,
        repeatMs  : repeatMs,
        streams   : streams,
        _lastTs   : ts,
        // particles used by the vortex phase
        vortexSeeds: Array.from({length: 28}, function(_, k) {
          return { angle: (k / 28) * Math.PI * 2, r: 10 + (k % 7) * 8, speed: 0.025 + (k % 5) * 0.008, size: 2 + (k % 4) * 1.2 };
        }),
      };
      fas = this._fas;
    }

    // ── frame-delta guard (tab hidden fix) ───────────────────────────────
    var frameDelta = ts - fas._lastTs;
    fas._lastTs = ts;
    if (frameDelta > 200) {
      fas.phaseStart = ts - Math.min(ts - fas.phaseStart,
        fas.phase === 'trail' ? fas.trailDur - 50 : fas.phase === 'vortex' ? fas.vortexDur - 50 : 0);
    }

    var ctx    = fas.ctx;
    var canvas = fas.canvas;
    var W = canvas.width, H = canvas.height;
    var sx = fas.sx, sy = fas.sy, ex = fas.ex, ey = fas.ey;
    var elapsed = ts - fas.phaseStart;

    // Helpers
    function lerp(a, b, t) { return a + (b - a) * t; }
    function eio(t)        { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function eoc(t)        { return 1 - Math.pow(1 - t, 3); }
    function clamp(v,mn,mx){ return Math.min(mx, Math.max(mn, v)); }

    // Vector src → dst plus its normal, used to offset the wind stream
    var dx = ex - sx, dy = ey - sy;
    var dist = Math.hypot(dx, dy) || 1;
    var nx = -dy / dist, ny = dx / dist; // normal vector

    ctx.clearRect(0, 0, W, H);

    // ── Phase: TRAIL — the wind blows from the button to the dial centre ────────────────
    if (fas.phase === 'trail') {
      var tp = clamp(elapsed / fas.trailDur, 0, 1);
      var head = eio(tp);

      fas.streams.forEach(function(st, si) {
        var stDelay = st.delay;
        var stElapsed = Math.max(0, elapsed - stDelay);
        var stTp  = clamp(stElapsed / (fas.trailDur - stDelay), 0, 1);
        var stHead = eio(stTp);
        if (stTp <= 0) return;

        var tail = Math.max(0, stHead - 0.45);

        // Offset point along the normal
        var ox = nx * st.offset, oy = ny * st.offset;
        var x1 = lerp(sx, ex, tail)  + ox;
        var y1 = lerp(sy, ey, tail)  + oy;
        var x2 = lerp(sx, ex, stHead)+ ox;
        var y2 = lerp(sy, ey, stHead)+ oy;

        if (Math.hypot(x2 - x1, y2 - y1) < 1) return;

        // Gradient along the stream
        var gr = ctx.createLinearGradient(x1, y1, x2, y2);
        gr.addColorStop(0,   'rgba(52,211,153,0)');
        gr.addColorStop(0.35,'rgba(52,211,153,' + (st.alpha * 0.4).toFixed(2) + ')');
        gr.addColorStop(0.75,'rgba(110,231,183,' + (st.alpha * 0.75).toFixed(2) + ')');
        gr.addColorStop(1,   'rgba(200,255,235,' + st.alpha.toFixed(2) + ')');

        ctx.save();
        ctx.strokeStyle = gr;
        ctx.lineWidth   = st.width;
        ctx.lineCap     = 'round';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur  = 8 + si * 2;

        // Draw a gentle curve (a horizontally offset quadratic bezier)
        var cpx = lerp(sx, ex, 0.5) + ox + nx * 12;
        var cpy = lerp(sy, ey, 0.5) + oy + ny * 12;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.stroke();
        ctx.restore();
      });

      // Glow at the head of the main stream
      var hx = lerp(sx, ex, head), hy = lerp(sy, ey, head);
      var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18);
      hg.addColorStop(0,   'rgba(200,255,235,0.9)');
      hg.addColorStop(0.5, 'rgba(52,211,153,0.45)');
      hg.addColorStop(1,   'rgba(52,211,153,0)');
      ctx.save();
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy, 18, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Switch to the vortex
      if (elapsed >= fas.trailDur) {
        fas.phase = 'vortex';
        fas.phaseStart = ts;
        // initial rotation angle per particle
        fas.vortexSeeds.forEach(function(p) { p.curAngle = p.angle; });
      }

    // ── Phase: VORTEX — the swirl grows and then fades ─────────────────────
    } else if (fas.phase === 'vortex') {
      var vp  = clamp(elapsed / fas.vortexDur, 0, 1);
      var vE  = eoc(vp);

      // Swirl scale: grows to ~1.8× then fades
      var maxR   = dialWrap ? (fas.ex ? 55 : 55) : 55;
      var scale  = 0.15 + vE * 1.85;
      var fadeA  = vp < 0.55 ? 1 : clamp(1 - (vp - 0.55) / 0.45, 0, 1);

      // Draw the spiral rings (3 layers)
      for (var ring = 0; ring < 3; ring++) {
        var rOffset = ring * (Math.PI * 2 / 3);
        var rScale  = scale * (0.55 + ring * 0.28);
        var rAlpha  = fadeA * (0.55 - ring * 0.12);
        var rR      = (28 + ring * 18) * rScale;
        var rWidth  = (2.5 - ring * 0.5);

        ctx.save();
        ctx.globalAlpha = clamp(rAlpha, 0, 1);
        ctx.strokeStyle = ring === 0 ? '#6ee7b7' : ring === 1 ? '#34d399' : '#a7f3d0';
        ctx.lineWidth   = rWidth;
        ctx.lineCap     = 'round';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur  = 12 + ring * 6;

        // Spiral: a multi-segment arc with an increasing radius
        ctx.beginPath();
        var steps = 80;
        var startAngle = rOffset + elapsed * (0.0018 + ring * 0.0005);
        for (var st2 = 0; st2 <= steps; st2++) {
          var pct = st2 / steps;
          var ang = startAngle + pct * Math.PI * (3.5 - ring * 0.5);
          var pr  = rR * (0.15 + pct * 0.85);
          var px  = ex + Math.cos(ang) * pr;
          var py  = ey + Math.sin(ang) * pr;
          if (st2 === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Suspended water particles flying along the swirl
      fas.vortexSeeds.forEach(function(p, pi) {
        p.curAngle += p.speed * (1 + vE * 1.2);
        var pr  = p.r * scale * (0.9 + 0.1 * Math.sin(ts * 0.002 + pi));
        var px  = ex + Math.cos(p.curAngle) * pr;
        var py  = ey + Math.sin(p.curAngle) * pr;
        var pA  = fadeA * 0.7;
        if (pA <= 0) return;
        ctx.save();
        ctx.globalAlpha = pA;
        ctx.fillStyle   = '#a7f3d0';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.arc(px, py, p.size * clamp(scale * 0.6, 0.3, 1.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Centre glow
      var cA = fadeA * 0.7;
      if (cA > 0) {
        var cR = 22 * scale;
        var cg2 = ctx.createRadialGradient(ex, ey, 0, ex, ey, cR);
        cg2.addColorStop(0,   'rgba(167,243,208,' + (cA * 0.85).toFixed(2) + ')');
        cg2.addColorStop(0.5, 'rgba(52,211,153,'  + (cA * 0.4).toFixed(2)  + ')');
        cg2.addColorStop(1,   'rgba(52,211,153,0)');
        ctx.save();
        ctx.fillStyle = cg2;
        ctx.beginPath(); ctx.arc(ex, ey, cR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Switch to wait
      if (elapsed >= fas.vortexDur) {
        ctx.clearRect(0, 0, W, H);
        fas.phase     = 'wait';
        fas.phaseStart = ts;
      }

    // ── Phase: WAIT ───────────────────────────────────────────────────────
    } else if (fas.phase === 'wait') {
      if (elapsed >= fas.repeatMs) {
        this._fas = null; // reset → re-initialise the coordinates
      }
    }

    this._fanAnimRaf = requestAnimationFrame(this._fanAnimLoop.bind(this));
  }

  _updateFanAnim() {
    var room = ROOMS[this._activeIdx];
    var hvac = room && this._hass && this._hass.states[room.id]
      ? (this._hass.states[room.id].attributes.hvac_mode || this._hass.states[room.id].state)
      : null;
    if (hvac === 'fan_only') {
      if (!this._fanAnimRunning) this._startFanWindAnim();
    } else {
      this._stopFanWindAnim();
    }
  }

  // ── Heat Mode Flame Trail Animation ─────────────────────────────────────
  // Shimmering heat rays from the heat button → dial centre → a flare that dies out

  _startHeatFlameAnim() {
    if (this._heatAnimRunning) return;
    this._heatAnimRunning = true;
    this._has = null;
    this._heatAnimRaf = requestAnimationFrame(this._heatAnimLoop.bind(this));
  }

  _stopHeatFlameAnim() {
    this._heatAnimRunning = false;
    if (this._heatAnimRaf) { cancelAnimationFrame(this._heatAnimRaf); this._heatAnimRaf = null; }
    this._has = null;
    var c = document.getElementById('heat-flame-global-canvas');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  _heatAnimLoop(ts) {
    if (!this._heatAnimRunning) return;
    var self = this;
    var has  = this._has;

    if (!has) {
      var room = ROOMS[this._activeIdx];
      var hvac = room && this._hass && this._hass.states && this._hass.states[room.id]
        ? (this._hass.states[room.id].attributes && this._hass.states[room.id].attributes.hvac_mode)
          || this._hass.states[room.id].state
        : null;
      if (hvac !== 'heat') { this._heatAnimRunning = false; return; }

      var sr = this.shadowRoot;
      if (!sr) { this._heatAnimRunning = false; return; }
      var dialWrap = sr.getElementById('dial-wrap-main');
      var heatBtn  = sr.querySelector('.mode-btn[data-hvac="heat"]');
      if (!dialWrap || !heatBtn) {
        this._heatAnimRaf = setTimeout(function() {
          if (self._heatAnimRunning) self._heatAnimRaf = requestAnimationFrame(self._heatAnimLoop.bind(self));
        }, 200);
        return;
      }

      var btnR  = heatBtn.getBoundingClientRect();
      var dialR = dialWrap.getBoundingClientRect();

      var canvas = document.getElementById('heat-flame-global-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'heat-flame-global-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99998;';
        document.body.appendChild(canvas);
      }
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      var repeatMs = Math.min(15000, Math.max(2000,
        (this._config && this._config.cool_anim_speed) || 10000));

      // Heat rays: 4 offset rays, jittering randomly over time
      var rays = [];
      for (var i = 0; i < 4; i++) {
        rays.push({ phase: i * Math.PI * 0.5, amp: 4 + i * 2, freq: 0.006 + i * 0.002 });
      }

      this._has = has = {
        canvas    : canvas,
        ctx       : canvas.getContext('2d'),
        sx        : btnR.left + btnR.width  / 2,
        sy        : btnR.top  + btnR.height / 2,
        ex        : dialR.left + dialR.width  / 2,
        ey        : dialR.top  + dialR.height / 2,
        phase     : 'trail',
        phaseStart: ts,
        trailDur  : 1600,
        burstDur  : 1800,
        repeatMs  : repeatMs,
        rays      : rays,
        // ember particles cho burst
        embers    : Array.from({length: 20}, function(_, k) {
          return {
            angle : (k / 20) * Math.PI * 2 + Math.random() * 0.3,
            speed : 0.6 + Math.random() * 0.8,
            r0    : 8 + Math.random() * 12,
            size  : 2 + Math.random() * 3,
            drift : (Math.random() - 0.5) * 0.04,
          };
        }),
        _lastTs   : ts,
      };
      has = this._has;
    }

    // frame-delta guard
    var frameDelta = ts - has._lastTs;
    has._lastTs = ts;
    if (frameDelta > 200) {
      has.phaseStart = ts - Math.min(ts - has.phaseStart,
        has.phase === 'trail' ? has.trailDur - 50 : has.phase === 'burst' ? has.burstDur - 50 : 0);
    }

    var ctx    = has.ctx;
    var canvas = has.canvas;
    var W = canvas.width, H = canvas.height;
    var sx = has.sx, sy = has.sy, ex = has.ex, ey = has.ey;
    var elapsed = ts - has.phaseStart;

    function lerp(a,b,t)  { return a+(b-a)*t; }
    function eio(t)       { return t<0.5?2*t*t:-1+(4-2*t)*t; }
    function eoc(t)       { return 1-Math.pow(1-t,3); }
    function clamp(v,a,b) { return Math.min(b,Math.max(a,v)); }

    // Normal vector used to sway the rays
    var dx = ex-sx, dy = ey-sy, dist = Math.hypot(dx,dy)||1;
    var nx = -dy/dist, ny = dx/dist;

    ctx.clearRect(0, 0, W, H);

    // ── Phase TRAIL: the shimmering heat rays run from the button → dial ──────────────
    if (has.phase === 'trail') {
      var tp   = clamp(elapsed / has.trailDur, 0, 1);
      var head = eio(tp);

      has.rays.forEach(function(ray, ri) {
        var rHead = clamp(head - ri * 0.06, 0, 1);
        if (rHead <= 0) return;
        var rTail = Math.max(0, rHead - 0.4);

        // Draw each ray as a jittered polyline (a heat zigzag)
        var steps = 30;
        ctx.save();
        ctx.beginPath();
        for (var s = 0; s <= steps; s++) {
          var pct = rTail + (rHead - rTail) * (s / steps);
          var px  = lerp(sx, ex, pct);
          var py  = lerp(sy, ey, pct);
          // Sway driven by a multi-frequency sine wave
          var shake = ray.amp * Math.sin(ts * ray.freq + s * 0.7 + ray.phase)
                    + ray.amp * 0.4 * Math.sin(ts * ray.freq * 1.7 + s * 1.3);
          px += nx * shake * (1 - Math.abs(pct - 0.5) * 2); // strongest in the middle
          py += ny * shake * (1 - Math.abs(pct - 0.5) * 2);
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        // Gradient: red-orange → yellow at the head
        var pStart = { x: lerp(sx,ex,rTail), y: lerp(sy,ey,rTail) };
        var pEnd   = { x: lerp(sx,ex,rHead), y: lerp(sy,ey,rHead) };
        var gr = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
        gr.addColorStop(0,   'rgba(255,80,0,0)');
        gr.addColorStop(0.3, 'rgba(255,120,20,' + (0.35 + ri * 0.08).toFixed(2) + ')');
        gr.addColorStop(0.75,'rgba(255,180,30,' + (0.6  + ri * 0.06).toFixed(2) + ')');
        gr.addColorStop(1,   'rgba(255,220,80,' + (0.85 + ri * 0.03).toFixed(2) + ')');
        ctx.strokeStyle = gr;
        ctx.lineWidth   = 2.5 - ri * 0.4;
        ctx.lineCap     = 'round';
        ctx.shadowColor = '#ff7b3b';
        ctx.shadowBlur  = 10 + ri * 3;
        ctx.stroke();
        ctx.restore();
      });

      // Glow at the head of the main ray
      var hx = lerp(sx, ex, head), hy = lerp(sy, ey, head);
      var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 20);
      hg.addColorStop(0,   'rgba(255,220,80,0.95)');
      hg.addColorStop(0.45,'rgba(255,120,30,0.5)');
      hg.addColorStop(1,   'rgba(255,60,0,0)');
      ctx.save(); ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy, 20, 0, Math.PI*2); ctx.fill(); ctx.restore();

      if (elapsed >= has.trailDur) {
        has.phase = 'burst'; has.phaseStart = ts;
        // initial angle for the ember
        has.embers.forEach(function(e) { e.curR = e.r0; });
      }

    // ── Phase BURST: the flare widens and embers fly out ────────────────
    } else if (has.phase === 'burst') {
      var bp  = clamp(elapsed / has.burstDur, 0, 1);
      var bE  = eoc(bp);

      // Instant flash at the centre
      var fA = Math.max(0, 1 - bp * 4);
      if (fA > 0) {
        var fg = ctx.createRadialGradient(ex,ey,0,ex,ey,55);
        fg.addColorStop(0,  'rgba(255,240,180,'+fA.toFixed(2)+')');
        fg.addColorStop(0.4,'rgba(255,140,30,'+(fA*0.7).toFixed(2)+')');
        fg.addColorStop(1,  'rgba(255,60,0,0)');
        ctx.save(); ctx.fillStyle=fg;
        ctx.beginPath(); ctx.arc(ex,ey,55,0,Math.PI*2); ctx.fill(); ctx.restore();
      }

      // The flare spreads — 3 colour layers
      var haloColors = [
        ['rgba(255,220,60,', 'rgba(255,130,20,', 50, 0.75],
        ['rgba(255,160,30,', 'rgba(255,80,10,',  80, 0.50],
        ['rgba(255,100,10,', 'rgba(200,40,0,',  110, 0.30],
      ];
      haloColors.forEach(function(h, hi) {
        var hR = h[2] * bE;
        var hA = Math.max(0, h[3] - bp * h[3]);
        if (hR < 1 || hA <= 0) return;
        var hg2 = ctx.createRadialGradient(ex,ey,0,ex,ey,hR);
        hg2.addColorStop(0,   h[0]+(hA*0.9).toFixed(2)+')');
        hg2.addColorStop(0.5, h[1]+(hA*0.55).toFixed(2)+')');
        hg2.addColorStop(1,   'rgba(255,40,0,0)');
        ctx.save(); ctx.fillStyle=hg2;
        ctx.beginPath(); ctx.arc(ex,ey,hR,0,Math.PI*2); ctx.fill(); ctx.restore();
      });

      // Glowing embers fly out and then drift down
      has.embers.forEach(function(em) {
        em.curR = em.r0 + bE * 55 * em.speed;
        em.angle += em.drift;
        var emX = ex + Math.cos(em.angle) * em.curR;
        var emY = ey + Math.sin(em.angle) * em.curR + bE * 15; // gentle fall
        var emA = Math.max(0, 0.85 - bp * 0.95);
        if (emA <= 0) return;
        ctx.save();
        ctx.globalAlpha = emA;
        // A small flame-drop shape
        ctx.fillStyle = bp < 0.4 ? '#ffdc50' : '#ff8c20';
        ctx.shadowColor = '#ff6010'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(emX, emY, em.size * (1 - bp * 0.5), 0, Math.PI*2);
        ctx.fill(); ctx.restore();
      });

      // Heat shimmer ring
      for (var ring = 0; ring < 2; ring++) {
        var rR2 = (35 + ring * 28) * bE;
        var rA2 = Math.max(0, (0.5 - ring * 0.12) * (1 - bp * 1.1));
        if (rR2 < 1 || rA2 <= 0) continue;
        ctx.save();
        ctx.globalAlpha = rA2;
        ctx.strokeStyle = ring === 0 ? '#ffb030' : '#ff7020';
        ctx.lineWidth   = 2 - ring * 0.5;
        ctx.shadowColor = '#ff7b3b'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(ex, ey, rR2, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }

      if (elapsed >= has.burstDur) {
        ctx.clearRect(0, 0, W, H);
        has.phase = 'wait'; has.phaseStart = ts;
      }

    } else if (has.phase === 'wait') {
      if (elapsed >= has.repeatMs) this._has = null;
    }

    this._heatAnimRaf = requestAnimationFrame(this._heatAnimLoop.bind(this));
  }

  _updateHeatAnim() {
    var room = ROOMS[this._activeIdx];
    var hvac = room && this._hass && this._hass.states[room.id]
      ? (this._hass.states[room.id].attributes.hvac_mode || this._hass.states[room.id].state)
      : null;
    if (hvac === 'heat') {
      if (!this._heatAnimRunning) this._startHeatFlameAnim();
    } else {
      this._stopHeatFlameAnim();
    }
  }

  // ── Dry Mode Moisture Absorption Animation ───────────────────────────────
  // Dew drops fly from the dry button → dial, dissolve into a mist that gets sucked in

  _startDryMistAnim() {
    if (this._dryAnimRunning) return;
    this._dryAnimRunning = true;
    this._das = null;
    this._dryAnimRaf = requestAnimationFrame(this._dryAnimLoop.bind(this));
  }

  _stopDryMistAnim() {
    this._dryAnimRunning = false;
    if (this._dryAnimRaf) { cancelAnimationFrame(this._dryAnimRaf); this._dryAnimRaf = null; }
    this._das = null;
    var c = document.getElementById('dry-mist-global-canvas');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  _dryAnimLoop(ts) {
    if (!this._dryAnimRunning) return;
    var self = this;
    var das  = this._das;

    if (!das) {
      var room = ROOMS[this._activeIdx];
      var hvac = room && this._hass && this._hass.states && this._hass.states[room.id]
        ? (this._hass.states[room.id].attributes && this._hass.states[room.id].attributes.hvac_mode)
          || this._hass.states[room.id].state
        : null;
      if (hvac !== 'dry') { this._dryAnimRunning = false; return; }

      var sr = this.shadowRoot;
      if (!sr) { this._dryAnimRunning = false; return; }
      var dialWrap = sr.getElementById('dial-wrap-main');
      var dryBtn   = sr.querySelector('.mode-btn[data-hvac="dry"]');
      if (!dialWrap || !dryBtn) {
        this._dryAnimRaf = setTimeout(function() {
          if (self._dryAnimRunning) self._dryAnimRaf = requestAnimationFrame(self._dryAnimLoop.bind(self));
        }, 200);
        return;
      }

      var btnR  = dryBtn.getBoundingClientRect();
      var dialR = dialWrap.getBoundingClientRect();

      var canvas = document.getElementById('dry-mist-global-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'dry-mist-global-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99998;';
        document.body.appendChild(canvas);
      }
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      var repeatMs = Math.min(15000, Math.max(2000,
        (this._config && this._config.cool_anim_speed) || 10000));

      // 18 dew drops — each follows its own curving trajectory
      var drops = Array.from({length: 18}, function(_, k) {
        return {
          t      : k / 18,                         // initial position along the path (0-1)
          delay  : k * 85,                          // ms delay
          offAmp : (Math.random() - 0.5) * 18,      // horizontal oscillation amplitude
          offFreq: 0.004 + Math.random() * 0.003,   // oscillation frequency
          size   : 2.5 + Math.random() * 3,
          alpha  : 0.5 + Math.random() * 0.4,
          phase  : Math.random() * Math.PI * 2,
        };
      });

      // Mist cloud for the absorb phase: semi-transparent round blobs
      var mistBlobs = Array.from({length: 14}, function(_, k) {
        return {
          angle : (k / 14) * Math.PI * 2,
          r0    : 15 + (k % 5) * 8,
          speed : 0.008 + (k % 4) * 0.003,
          size  : 8 + (k % 5) * 5,
          alpha : 0.18 + (k % 4) * 0.04,
          curAng: (k / 14) * Math.PI * 2,
        };
      });

      this._das = das = {
        canvas    : canvas,
        ctx       : canvas.getContext('2d'),
        sx        : btnR.left + btnR.width  / 2,
        sy        : btnR.top  + btnR.height / 2,
        ex        : dialR.left + dialR.width  / 2,
        ey        : dialR.top  + dialR.height / 2,
        phase     : 'trail',
        phaseStart: ts,
        trailDur  : 2000,
        absorbDur : 2000,
        repeatMs  : repeatMs,
        drops     : drops,
        mistBlobs : mistBlobs,
        _lastTs   : ts,
      };
      das = this._das;
    }

    // frame-delta guard
    var frameDelta = ts - das._lastTs;
    das._lastTs = ts;
    if (frameDelta > 200) {
      das.phaseStart = ts - Math.min(ts - das.phaseStart,
        das.phase === 'trail' ? das.trailDur - 50 : das.phase === 'absorb' ? das.absorbDur - 50 : 0);
    }

    var ctx    = das.ctx;
    var canvas = das.canvas;
    var W = canvas.width, H = canvas.height;
    var sx = das.sx, sy = das.sy, ex = das.ex, ey = das.ey;
    var elapsed = ts - das.phaseStart;

    function lerp(a,b,t)  { return a+(b-a)*t; }
    function eio(t)       { return t<0.5?2*t*t:-1+(4-2*t)*t; }
    function eoc(t)       { return 1-Math.pow(1-t,3); }
    function clamp(v,a,b) { return Math.min(b,Math.max(a,v)); }

    var dx = ex-sx, dy = ey-sy, dist = Math.hypot(dx,dy)||1;
    var nx = -dy/dist, ny = dx/dist;

    ctx.clearRect(0, 0, W, H);

    // ── Phase TRAIL: curving dew drops fly to the dial ─────────────────────
    if (das.phase === 'trail') {
      var tp = clamp(elapsed / das.trailDur, 0, 1);

      das.drops.forEach(function(drop) {
        var dElapsed = Math.max(0, elapsed - drop.delay);
        var dTp = clamp(dElapsed / (das.trailDur * 0.75), 0, 1);
        if (dTp <= 0) return;

        var pos = eio(dTp);
        // The drop curves along the normal
        var wave = drop.offAmp * Math.sin(ts * drop.offFreq + drop.phase + pos * Math.PI * 2.5);
        var px = lerp(sx, ex, pos) + nx * wave;
        var py = lerp(sy, ey, pos) + ny * wave;

        // Alpha: fades in at the head and dims toward the target
        var dA = drop.alpha * Math.min(1, dTp * 3) * (1 - Math.max(0, (pos - 0.7) / 0.3) * 0.6);

        // Draw the drop (a slightly offset teardrop shape)
        ctx.save();
        ctx.globalAlpha = clamp(dA, 0, 1);
        var r = drop.size * (0.7 + 0.3 * Math.sin(ts * 0.006 + drop.phase));
        // Purple flare glow
        ctx.shadowColor = '#c4b5fd'; ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(196,181,253,0.85)';
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
        // Small highlight inside
        ctx.globalAlpha = clamp(dA * 0.5, 0, 1);
        ctx.fillStyle = '#ede9fe';
        ctx.beginPath(); ctx.arc(px - r*0.25, py - r*0.25, r*0.35, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Faint mist trail along the path
      var trailHead = eio(clamp(elapsed / das.trailDur, 0, 1));
      if (trailHead > 0.05) {
        var gr = ctx.createLinearGradient(sx, sy, lerp(sx,ex,trailHead), lerp(sy,ey,trailHead));
        gr.addColorStop(0,   'rgba(167,139,250,0)');
        gr.addColorStop(0.4, 'rgba(167,139,250,0.08)');
        gr.addColorStop(1,   'rgba(196,181,253,0.18)');
        ctx.save();
        ctx.strokeStyle = gr; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.filter = 'blur(4px)';
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(lerp(sx,ex,trailHead), lerp(sy,ey,trailHead));
        ctx.stroke(); ctx.restore();
      }

      if (elapsed >= das.trailDur) {
        das.phase = 'absorb'; das.phaseStart = ts;
      }

    // ── Phase ABSORB: the mist orbits the dial and is then sucked in ──────────
    } else if (das.phase === 'absorb') {
      var ap  = clamp(elapsed / das.absorbDur, 0, 1);
      var aE  = eoc(ap);

      // Mist scale: expands and then contracts (dehumidifying)
      // 0->0.4: expands  |  0.4->1: contracts and is drawn in
      var expandP = clamp(ap / 0.4, 0, 1);
      var shrinkP = clamp((ap - 0.4) / 0.6, 0, 1);
      var mistScale = ap < 0.4
        ? eoc(expandP) * 1.3
        : lerp(1.3, 0.1, eio(shrinkP));
      var mistAlpha = ap < 0.4
        ? eoc(expandP)
        : Math.max(0, 1 - eio(shrinkP) * 1.15);

      // The mist blob spins and shrinks
      das.mistBlobs.forEach(function(blob) {
        blob.curAng += blob.speed * (1 + shrinkP * 2.5); // accelerates while being sucked in
        var bR = blob.r0 * mistScale;
        var bX = ex + Math.cos(blob.curAng) * bR;
        var bY = ey + Math.sin(blob.curAng) * bR;
        var bA = blob.alpha * mistAlpha;
        if (bA <= 0 || bR < 0.5) return;

        var bSize = blob.size * clamp(mistScale, 0.1, 1.5);
        ctx.save();
        ctx.globalAlpha = clamp(bA, 0, 1);
        var bg = ctx.createRadialGradient(bX,bY,0,bX,bY,bSize);
        bg.addColorStop(0,   'rgba(233,213,255,0.9)');
        bg.addColorStop(0.5, 'rgba(167,139,250,0.55)');
        bg.addColorStop(1,   'rgba(139,92,246,0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(bX, bY, bSize, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Centre glow: brightens once absorption finishes
      var cA = shrinkP * 0.8;
      if (cA > 0.02) {
        var cScale = 0.3 + (1 - shrinkP) * 0.9;
        var cg = ctx.createRadialGradient(ex,ey,0,ex,ey,40*cScale);
        cg.addColorStop(0,   'rgba(233,213,255,'+(cA*0.9).toFixed(2)+')');
        cg.addColorStop(0.45,'rgba(167,139,250,'+(cA*0.55).toFixed(2)+')');
        cg.addColorStop(1,   'rgba(139,92,246,0)');
        ctx.save(); ctx.fillStyle=cg;
        ctx.beginPath(); ctx.arc(ex,ey,40*cScale,0,Math.PI*2); ctx.fill(); ctx.restore();
      }

      // Small drops rush into the centre as it shrinks
      if (shrinkP > 0.1) {
        for (var di = 0; di < 8; di++) {
          var dAng = (di / 8) * Math.PI * 2 + shrinkP * Math.PI * 3 + elapsed * 0.003;
          var dDist = (1 - shrinkP) * 45;
          var dX = ex + Math.cos(dAng) * dDist;
          var dY = ey + Math.sin(dAng) * dDist;
          var dA2 = Math.max(0, 0.7 - shrinkP * 0.8);
          if (dA2 <= 0) continue;
          ctx.save();
          ctx.globalAlpha = dA2;
          ctx.fillStyle = '#c4b5fd';
          ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(dX, dY, 2.5, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        }
      }

      if (elapsed >= das.absorbDur) {
        ctx.clearRect(0, 0, W, H);
        das.phase = 'wait'; das.phaseStart = ts;
      }

    } else if (das.phase === 'wait') {
      if (elapsed >= das.repeatMs) this._das = null;
    }

    this._dryAnimRaf = requestAnimationFrame(this._dryAnimLoop.bind(this));
  }

  _updateDryAnim() {
    var room = ROOMS[this._activeIdx];
    var hvac = room && this._hass && this._hass.states[room.id]
      ? (this._hass.states[room.id].attributes.hvac_mode || this._hass.states[room.id].state)
      : null;
    if (hvac === 'dry') {
      if (!this._dryAnimRunning) this._startDryMistAnim();
    } else {
      this._stopDryMistAnim();
    }
  }

  _calcEta(roomIdx, setTemp, curTemp, fanMode) {
    if (curTemp <= setTemp) return null;
    var remaining = curTemp - setTemp;

    // ── Initial estimate based on fan speed (used until real data arrives) ──
    // Typical rate: an ordinary split AC manages ~0.3–1.0°C/min depending on the fan
    var fanRateMap = {
      'auto': 0.55, 'min': 0.25, 'low': 0.35,
      'low_mid': 0.45, 'medium': 0.55,
      'high_mid': 0.70, 'high': 0.85, 'max': 1.0,
      'low/auto': 0.40, 'high/auto': 0.80, 'quiet': 0.20
    };
    var fm = (fanMode || 'auto').toLowerCase().replace(/[\s-]/g, '_');
    var estimatedRate = fanRateMap[fm] || fanRateMap['auto'];
    var etaEstimated = Math.round(remaining / estimatedRate);

    // ── Derive the real rate from the history ──────────────────────────────────
    var hist = this._tempHistory[roomIdx];
    if (hist && hist.length >= 2) {
      var now = Date.now();
      // Take the last 8 minutes
      var cutoff = now - 8 * 60 * 1000;
      var pts = hist.filter(function(p) { return p.t >= cutoff; });
      if (pts.length < 2) pts = hist.slice(-Math.min(hist.length, 6));

      if (pts.length >= 2) {
        var first = pts[0], lastPt = pts[pts.length - 1];
        var dtMin = (lastPt.t - first.t) / 60000;
        if (dtMin >= 0.4) {
          var dTemp = first.temp - lastPt.temp; // positive while cooling
          if (dTemp > 0) {
            var measuredRate = dTemp / dtMin;
            if (measuredRate >= 0.01) {
              // Blend: start at 50% estimated → 100% measured after 5 minutes of data
              var blendFactor = Math.min(1, dtMin / 5);
              var blendedRate = estimatedRate * (1 - blendFactor) + measuredRate * blendFactor;
              var etaMeasured = Math.round(remaining / blendedRate);
              if (etaMeasured > 0 && etaMeasured <= 999) {
                return { eta: etaMeasured, rate: blendedRate, mode: blendFactor >= 0.95 ? 'measured' : 'blending' };
              }
            }
          }
        }
      }
    }

    // Fallback: the initial estimate
    if (etaEstimated > 0 && etaEstimated <= 999) {
      return { eta: etaEstimated, rate: estimatedRate, mode: 'estimated' };
    }
    return null;
  }

  setConfig(c) {
    this._config = Object.assign({}, AC_DEFAULT_CONFIG, c);
    // Carry a legacy humidity_entity across to the name the resolver reads.
    // Without this the default placeholder wins and the user's own entity is
    // silently ignored: the outdoor humidity cell simply never appears.
    if (c && c.humidity_entity && !c.outdoor_humidity_entity) {
      this._config.outdoor_humidity_entity = c.humidity_entity;
    }
    // The language follows HA, so any `language:` left over from an older
    // dashboard is ignored. Before the first `set hass` we have nothing to
    // follow yet, so the default table is used until then.
    this._config.language = this._hass ? acLangFromHass(this._hass) : AC_DEFAULT_CONFIG.language;
    this._buildRooms(this._config.language);
    // setConfig never re-rendered, so a changed config only reached the DOM if
    // some unrelated tracked entity happened to change first. It also left the
    // model and the DOM disagreeing: shrinking room_count rebuilt ROOMS while
    // the old tabs stayed on screen, and tapping a leftover tab set an index
    // past the end of the array, which threw on the next render. The drag guard
    // is honoured here too, because re-rendering mid-drag is what strands the
    // flag and would freeze every later update.
    if (this._hass && !this._slDragging && !this._dialDragging) this._renderFull();

    // ── Restore the selected room from localStorage (survives reload / navigation) ──
    // Key derived from the first entity → each card instance gets its own key
    this._cardKey = 'ac_active_room_' + (ROOMS[0] ? ROOMS[0].id.replace(/[^a-z0-9]/gi, '_') : 'default');
    try {
      var savedRoom = parseInt(localStorage.getItem(this._cardKey));
      if (!isNaN(savedRoom) && savedRoom >= 0 && savedRoom < ROOMS.length) {
        this._activeIdx = savedRoom;
      }
    } catch(e) {}

    // When cool_anim_speed changes → restart the animation immediately
    var newSpeed = c && c.cool_anim_speed;
    if (newSpeed && newSpeed !== this._prevCoolAnimSpeed) {
      this._prevCoolAnimSpeed = newSpeed;
      if (this._cas) {
        if (this._cas.phase === 'wait') {
          // Currently waiting → reset right away to start a new cycle
          this._cas = null;
        } else {
          // Currently in trail/burst → update repeatMs so the next cycle uses the new value
          this._cas.repeatMs = Math.min(15000, Math.max(2000, newSpeed));
        }
      }
    }
  }

  static getConfigElement() {
    return document.createElement('multi-air-conditioner-card-editor');
  }

  static getStubConfig() {
    return {
      // Labels come from the default (zh) table so a fresh card is never
      // seeded with text the user cannot read.
      entities: [
        { entity_id: 'climate.dieu_hoa_living',         label: AC_TRANSLATIONS.zh.rooms[0], area: '25 m²', icon: 'mdi:sofa' },
        { entity_id: 'climate.bed_air_conditioning',     label: AC_TRANSLATIONS.zh.rooms[1], area: '18 m²', icon: 'mdi:bed' },
        { entity_id: 'climate.kitchen_air_conditioning', label: AC_TRANSLATIONS.zh.rooms[2], area: '20 m²', icon: 'mdi:silverware-fork-knife' },
        { entity_id: 'climate.dieu_hoa_office',          label: AC_TRANSLATIONS.zh.rooms[3], area: '15 m²', icon: 'mdi:briefcase' },
      ],
      pm25_entity:      'sensor.pm25',
      outdoor_temp_entity: 'sensor.outdoor_temperature',
      // Outdoor humidity. `humidity_entity` is the older name for the same
      // reading. Because the default below fills outdoor_humidity_entity with a
      // placeholder, and the resolver reads that name first, a user who sets
      // only the legacy key would be shadowed -- setConfig carries their value
      // across. Per-room indoor readings are entities[n].temp_entity /
      // entities[n].humidity_entity and are unrelated to either name.
      outdoor_humidity_entity: 'sensor.outdoor_humidity',
      humidity_entity:  'sensor.outdoor_humidity',
      power_entity:     'sensor.ac_power_kwh',
    };
  }
  getCardSize() { return 8; }

  _s(id)       { return this._stateOf(this._hass, id); }
  _a(id, k)    { return this._attrOf(this._hass, id, k); }

  // Select the room and store it in localStorage so it is remembered after a reload
  _setActiveRoom(idx) {
    this._activeIdx = idx;
    try {
      if (this._cardKey) localStorage.setItem(this._cardKey, String(idx));
    } catch(e) {}
  }
  _call(d,s,x) { this._hass.callService(d, s, x); }

  // ── FIX: connectedCallback – inject the font + CSS exactly once ────────────
  connectedCallback() {
    if (this.shadowRoot.querySelector('[data-ac-style]')) return;

    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Orbitron:wght@400;600;800&display=swap';
    link.setAttribute('data-ac-style', 'font');
    this.shadowRoot.appendChild(link);

    var style = document.createElement('style');
    style.setAttribute('data-ac-style', 'css');
    style.textContent = CARD_CSS;
    this.shadowRoot.appendChild(style);

    // Start the 10s interval that keeps the live temperature + ETA up to date
    this._startRefresh();

    // Resume every running timer (after a reload)
    var self2 = this;
    Object.keys(this._timers).forEach(function(idx) {
      var t = self2._timers[idx];
      if (t && t.end > Date.now() && !t.int) {
        self2._startTick(parseInt(idx));
      }
    });
    // -- Auto-scale: watch card width and scale down if needed --
    var self3 = this;
    var _scaleRafId = null;
    var _scalePending = false;
    function _applyScale() {
      var wrap = self3.shadowRoot && self3.shadowRoot.getElementById('ac-scale-wrap');
      if (!wrap) return;
      var card = wrap.firstElementChild;
      if (!card) return;
      var isSL = (self3._config && self3._config.view_mode === 'super_lite');
      var designW = isSL ? 320 : 460;
      // Read availW from self3 (the host element) — NOT from the wrapper, to avoid a feedback loop
      var availW = self3.getBoundingClientRect().width || designW;
      if (availW < 10) return;
      if (availW >= designW) {
        // Desktop / wide: card stretches full width, no scale
        card.style.transform = '';
        card.style.width = '100%';
        card.style.minWidth = '';
        // Only clear the height if it was set, to avoid repeated layout thrash
        if (wrap.style.height) wrap.style.height = '';
      } else {
        // Mobile / narrow: scale down proportionally
        var scale = availW / designW;
        var scaleStr = scale.toFixed(4);
        // Only set the transform when the value really changes, to avoid flicker
        var curTransform = card.style.transform;
        var newTransform = 'scale(' + scaleStr + ')';
        if (curTransform !== newTransform) {
          card.style.transform = newTransform;
        }
        if (card.style.width !== designW + 'px') {
          card.style.width = designW + 'px';
          card.style.minWidth = designW + 'px';
        }
        // Measure the height AFTER the transform is set (using scrollHeight so the scale does not distort it)
        var naturalH = card.scrollHeight || card.offsetHeight;
        var newH = Math.round(naturalH * scale) + 'px';
        if (wrap.style.height !== newH) wrap.style.height = newH;
      }
    }
    // Debounced wrapper — avoids repeat calls when ResizeObserver fires many entries
    function _scheduleScale() {
      if (_scalePending) return;
      _scalePending = true;
      _scaleRafId = requestAnimationFrame(function() {
        _scalePending = false;
        _applyScale();
      });
    }
    self3._applyScale = _applyScale;
    self3._scheduleScale = _scheduleScale;
    if (window.ResizeObserver) {
      // Observe the host element to get the container width; do NOT observe wrap/card
      // (that would cause a feedback loop: the scale changes the height → ResizeObserver fires again)
      self3._scaleObs = new ResizeObserver(function(entries) {
        // Ignore entries where only the height changed (we set wrap.style.height ourselves)
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (entry.contentBoxSize) {
            var w = entry.contentBoxSize[0] ? entry.contentBoxSize[0].inlineSize : entry.contentRect.width;
            if (w < 10) continue;
          }
        }
        _scheduleScale();
      });
      self3._scaleObs.observe(self3);
    }
  }

  // Render icon: 'mdi:*' → <ha-icon>, otherwise → a text span (emoji fallback)
  // color: optional — when given, sets a specific icon colour; inherits by default
  _mdiIcon(icon, size, color) {
    size = size || 20;
    var clr = color || 'inherit';
    if (icon && icon.indexOf('mdi:') === 0) {
      return '<ha-icon icon="' + escHtml(icon) + '" style="--mdc-icon-size:' + size + 'px;--mdc-icon-color:' + clr + ';width:' + size + 'px;height:' + size + 'px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;color:' + clr + '"></ha-icon>';
    }
    return '<span style="font-size:' + Math.round(size * 0.85) + 'px;line-height:1;vertical-align:middle;color:' + clr + '">' + escHtml(icon || '') + '</span>';
  }

  _arc(cx, cy, r, a1, a2) {
    var rad = function(d) { return (d - 90) * Math.PI / 180; };
    var x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
    var x2 = cx + r * Math.cos(rad(a2)), y2 = cy + r * Math.sin(rad(a2));
    var lg = (a2 - a1 > 180) ? 1 : 0;
    return 'M' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + lg + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2);
  }

  // Build ROOMS from room_count, the built-in defaults and any configured
  // entities. Extracted out of setConfig so that `set hass` can rebuild it
  // when the HA language changes -- the placeholder room names are localised.
  _buildRooms(lang) {
    var tr   = AC_TRANSLATIONS[lang] || AC_TRANSLATIONS.en;
    var ents = this._config.entities;
    var roomCount = Math.max(1, Math.min(8, parseInt(this._config.room_count) || 4));
    this._config.room_count = roomCount;

    ROOMS.length = 0;
    for (var r = 0; r < roomCount; r++) {
      var def = ROOMS_DEFAULT[r] || {
        id: 'climate.room_' + (r + 1),
        area: '15 m\u00b2',
        icon: 'mdi:snowflake',
      };
      // Placeholder names only; a configured entities[] entry overrides them.
      // tr.rooms only carries four translated names and room_count goes to
      // eight, so r % tr.rooms.length wrapped room 5 back onto room 1 -- and the
      // assignment below then threw away the correct per-index label that
      // ROOMS_DEFAULT already had. Fall back to that instead of the index wrap.
      var defLbl = (tr.rooms && tr.rooms[r]) || def.label || ('Room ' + (r + 1));
      ROOMS.push(Object.assign({}, def, { label: defLbl }));
    }

    if (ents && Array.isArray(ents)) {
      for (var i = 0; i < Math.min(ents.length, ROOMS.length); i++) {
        if (ents[i] && ents[i].entity_id) ROOMS[i].id    = ents[i].entity_id;
        if (ents[i] && ents[i].label)     ROOMS[i].label = ents[i].label;
        // `area` used to be copied into ROOMS here and then never rendered
        // anywhere, and the editor never offered a field for it -- a config key
        // that is accepted, stored and discarded. ROOMS_DEFAULT still carries
        // the value as placeholder data; it is simply not a setting.
        if (ents[i] && ents[i].icon)      ROOMS[i].icon  = ents[i].icon;
        if (ents[i] && ents[i].image)     ROOMS[i].image = ents[i].image;
      }
    }
    // Apply the active language to ROOMS when the label has not been customised
    for (var j = 0; j < ROOMS.length; j++) {
      if (!ents || !ents[j] || !ents[j].label) {
        ROOMS[j].label = (tr.rooms && tr.rooms[j]) || ROOMS[j].label;
        ROOMS[j].icon  = (tr.roomIcons && tr.roomIcons[j]) || ROOMS[j].icon;
      }
    }
    // Make sure activeIdx does not exceed the room count
    if (this._activeIdx >= ROOMS.length) this._activeIdx = 0;
  }

  _renderFull() {
    if (!this._hass) return;
    var self = this;

    var cfg    = this._config || {};
    var lang   = cfg.language || 'en';
    var tr     = AC_TRANSLATIONS[lang] || AC_TRANSLATIONS.en;
    var bgGrad = acPresetGradient(cfg.background_preset, cfg.bg_color1, cfg.bg_color2, cfg.bg_alpha);
    var alphaPctBlur = (cfg.bg_alpha !== undefined && cfg.bg_alpha !== null) ? Math.max(0, Math.min(100, parseInt(cfg.bg_alpha))) : 80;
    var bgBlurPx = Math.round(alphaPctBlur / 100 * 28);
    var bgBlurStyle = '--card-blur:' + bgBlurPx + 'px;';
    // accent_color and text_color are NOT applied. --accent is emitted from the
    // per-mode colour on purpose (cool blue, heat orange, ...) and nothing in
    // the stylesheet reads --text. They used to be read into locals here that
    // were then never used, while the editor's reset button still advertised
    // them as live colour options. The keys remain in AC_DEFAULT_CONFIG so an
    // existing dashboard keeps loading; they are simply not settings.

    var room    = ROOMS[this._activeIdx];
    var hvac    = this._s(room.id);
    var isUnavailable = (hvac === 'unavailable' || hvac === 'unknown');
    var isOn    = !isUnavailable && hvac !== 'off';
    // When unavailable, treat it as off for the display calculations
    if (isUnavailable) hvac = 'off';
    var curTemp = parseFloat(this._a(room.id,'current_temperature') || 26);
    var setTemp = parseFloat(this._a(room.id,'temperature')         || 24);
    var fanMode  = this._a(room.id,'fan_mode')     || 'auto';
    var swingMode= this._a(room.id,'swing_mode')   || 'off';
    // Horizontal swing is optional: only shown when the entity publishes it.
    var hswingModes = (function() {
      var raw = this._a(room.id, 'swing_horizontal_modes');
      return (Array.isArray(raw) && raw.length > 0) ? raw : null;
    }).call(this);
    var hasHswing   = !!hswingModes && cfg.show_hswing !== false;
    var hswingMode  = hasHswing ? (this._a(room.id,'swing_horizontal_mode') || hswingModes[0]) : null;
    var hswingLabel = hasHswing ? ((tr.hswingMap && tr.hswingMap[hswingMode]) || escHtml(hswingMode)) : null;
    var supportedFanModes = (function() {
      var raw = this._a(room.id,'fan_modes');
      return (Array.isArray(raw) && raw.length > 0) ? raw : null;
    }).call(this);
    var chipSpecs = acChipSpec(this._config, tr, room, this._hass);
    // Override curTemp from the room sensor when one is configured
    var roomEntCfg = (cfg.entities && cfg.entities[this._activeIdx]) || {};
    if (roomEntCfg.temp_entity && this._hass && this._hass.states[roomEntCfg.temp_entity]) {
      var sensorTemp = parseFloat(this._hass.states[roomEntCfg.temp_entity].state);
      if (!isNaN(sensorTemp)) curTemp = sensorTemp;
    }
    // Override roomHumidity from the room sensor when configured (read early for the header)
    var roomHumidityRaw = parseFloat(this._a(room.id, 'current_humidity') || this._a(room.id, 'humidity') || 0);
    if (roomEntCfg.humidity_entity && this._hass && this._hass.states[roomEntCfg.humidity_entity]) {
      var sensorHum = parseFloat(this._hass.states[roomEntCfg.humidity_entity].state);
      if (!isNaN(sensorHum)) roomHumidityRaw = sensorHum;
    }
    var roomHumidityDisplay = roomHumidityRaw > 0 ? Math.round(roomHumidityRaw) + '%' : '--';
    var isLite  = this._config.view_mode === 'lite';
    // _buildRooms clamps this, but a click on a stale tab can set an index past
    // the end of ROOMS, and `ROOMS[idx].id` then throws. Clamp here too so no
    // order of events can kill the card.
    if (this._activeIdx >= ROOMS.length) this._activeIdx = 0;
    var tUnit   = cfg.temp_unit || 'C';   // 'C' | 'F' — the display unit the user selected
    // Auto-detect the unit HA returns: a value > 50 means °F, otherwise °C
    // (room temperature in °C is always 16–45, in °F always 60–113 — the ranges never overlap)
    var haUnit  = curTemp > 50 ? 'F' : 'C';
    var curTempDisp = acFmtTemp(curTemp, tUnit, haUnit);
    var setTempDisp = acFmtSetTemp(setTemp, tUnit, haUnit);
    var degSym      = tUnit === 'F' ? '°F' : '°C';
    var fi  = Math.max(0, FAN_LEVELS.indexOf(fanMode));
    // Use the entity's real supported fan_modes; fall back to FAN_LEVELS
    var activeFanModes = supportedFanModes || FAN_LEVELS;
    // fi_active: index of fanMode in the device's real list (so fillCount matches the device)
    var fi_active = Math.max(0, activeFanModes.indexOf(fanMode));
    var si  = Math.max(0, SWING_LEVELS.indexOf(swingMode));
    var mode    = MODE_CFG[hvac] || MODE_CFG.cool;
    // Localise mode labels and fan/swing labels
    mode = Object.assign({}, mode, { lbl: tr.modes[hvac] || mode.lbl });
    var fanLabels   = tr.fans   || ['Auto','Min','Low','Low-Mid','Medium','High-Mid','High','Max','Low/Auto','High/Auto','Quiet'];
    var swingLabels = tr.swings || ['Fixed','Up/Down','Left/Right','Both','Position 1','Position 2','Position 3','Position 4','Position 5','Position 6'];
    // Label for the current swing: map the swing_mode string → a localised label
    var swingModeToLabel = { off: swingLabels[0], vertical: swingLabels[1], horizontal: swingLabels[2], both: swingLabels[3] };
    // Numeric positions 1-6
    for (var _si = 1; _si <= 6; _si++) { swingModeToLabel[String(_si)] = swingLabels[3 + _si] || ('Pos ' + _si); }
    var swingCurrentLabel = acSwingLabel(tr, swingMode, swingLabels);

    // Arc range always in °C (16–32°C) — convert if haUnit is °F
    var curTempC = haUnit === 'F' ? acFtoC(curTemp) : curTemp;
    var setTempC = haUnit === 'F' ? acFtoC(setTemp) : setTemp;

    // dial_invert: false (default) = setTemp outer (haptic drag) + curTemp inner
    //              true            = curTemp outer (original)    + setTemp inner
    var dialInvert = cfg.dial_invert === true;

    // Outer ring (r=88) — haptic drag if !dialInvert
    var outerTempC  = dialInvert ? curTempC : setTempC;
    var outerColor  = dialInvert ? null : mode.color; // null = use arcGrad
    var outerIsDrag = !dialInvert; // outer ring is the draggable set-temp ring
    var pct    = Math.max(0, Math.min(1, (outerTempC - 16) / 16));
    var arcEnd = -140 + pct * 280;
    var dotRad = (arcEnd - 90) * Math.PI / 180;
    var dotX   = (110 + 88 * Math.cos(dotRad)).toFixed(1);
    var dotY   = (110 + 88 * Math.sin(dotRad)).toFixed(1);

    var now     = new Date();
    var timeStr = now.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
    var dateStr = now.toLocaleDateString('vi-VN', {weekday:'long', day:'2-digit', month:'2-digit'});

    var arcTrack = this._arc(110,110,88,-140,140);
    var arcFill  = pct > 0.02 ? this._arc(110,110,88,-140,arcEnd) : '';

    // Inner ring (r=76)
    var innerTempC   = dialInvert ? setTempC : curTempC;
    var innerIsSet   = dialInvert; // inner ring is setTemp only when inverted
    var setPct    = Math.max(0, Math.min(1, (innerTempC - 16) / 16));
    var setArcEnd = -140 + setPct * 280;
    var innerTrack   = this._arc(110,110,76,-140,140);
    var innerArcFill = setPct > 0.02 ? this._arc(110,110,76,-140,setArcEnd) : '';
    var innerSetDotRad = (setArcEnd - 90) * Math.PI / 180;
    var innerSetDotX   = (110 + 76 * Math.cos(innerSetDotRad)).toFixed(1);
    var innerSetDotY   = (110 + 76 * Math.sin(innerSetDotRad)).toFixed(1);

    // Outer arc fill — if outerIsDrag: use mode.color for setTemp ring; else arcGrad for curTemp
    var arcFillSvg = '';
    if (pct > 0.02) {
      var outerStroke = outerIsDrag ? mode.color : 'url(#arcGrad)';
      var outerWidth  = outerIsDrag ? '10' : '12';
      arcFillSvg = '<path data-ring="outer" d="' + arcFill + '" fill="none" stroke="' + outerStroke + '" stroke-width="' + outerWidth + '" stroke-linecap="round" filter="url(#arcGlow)" opacity="0.95"/>';
    }
    var dotSvg = '';
    if (pct > 0.02) {
      var dotFill = outerIsDrag ? mode.color : mode.color;
      // Outer dot: larger + drag handle style when it's the setTemp ring
      if (outerIsDrag) {
        dotSvg = '<circle data-ring="outer" cx="' + dotX + '" cy="' + dotY + '" r="11" fill="rgba(0,0,0,0.4)" filter="url(#dotGlow)"/>'
               + '<circle data-ring="outer" cx="' + dotX + '" cy="' + dotY + '" r="9" fill="' + mode.color + '" filter="url(#dotGlow)"/>'
               + '<circle data-ring="outer" cx="' + dotX + '" cy="' + dotY + '" r="4" fill="white" opacity="0.95"/>';
      } else {
        dotSvg = '<circle data-ring="outer" cx="' + dotX + '" cy="' + dotY + '" r="8" fill="' + mode.color + '" filter="url(#dotGlow)"/>'
               + '<circle data-ring="outer" cx="' + dotX + '" cy="' + dotY + '" r="4" fill="white" opacity="0.9"/>';
      }
    }
    // Inner arc/dot colors
    // When !dialInvert: inner = curTemp → gradient blue→red based on temperature
    var innerArcColor = dialInvert ? mode.color : 'url(#innerTempGrad)';
    var innerArcWidth = dialInvert ? '4' : '6';
    var innerDotR1    = dialInvert ? '4' : '5';
    var innerDotR2    = dialInvert ? '2' : '2.5';
    // Gradient stops for inner arc (curTemp ring): blue (cold 16°C) → cyan → green → orange → red (hot 32°C)
    var _itPct = Math.max(0, Math.min(1, (curTempC - 16) / 16));
    var innerGradStart = _itPct < 0.33 ? '#3b9eff' : (_itPct < 0.66 ? '#34d399' : '#f97316');
    var innerGradMid   = _itPct < 0.5  ? '#22d3ee' : '#fb923c';
    var innerGradEnd   = _itPct < 0.5  ? '#34d399' : '#ef4444';
    // Dynamic dot color for inner arc endpoint — interpolate blue→green→orange→red
    var innerDotColor = _itPct < 0.25 ? '#3b9eff'
                      : _itPct < 0.5  ? '#34d399'
                      : _itPct < 0.75 ? '#fb923c'
                      : '#ef4444';

    // Tick marks
    var ticks = '';
    for (var k = 0; k < 17; k++) {
      var tDeg = -140 + k * 280 / 16;
      var tRad = (tDeg - 90) * Math.PI / 180;
      var tx1 = (110 + 79 * Math.cos(tRad)).toFixed(1), ty1 = (110 + 79 * Math.sin(tRad)).toFixed(1);
      var tx2 = (110 + 85 * Math.cos(tRad)).toFixed(1), ty2 = (110 + 85 * Math.sin(tRad)).toFixed(1);
      ticks += '<line x1="' + tx1 + '" y1="' + ty1 + '" x2="' + tx2 + '" y2="' + ty2 + '" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-linecap="round"/>';
    }

    // Fan bar chart
    var barHeights = [7,10,13,16,19,22,26,30];
    // fillCount: map fan level index to number of bars filled (8 bars total)
    // indices: auto,min,low,low_mid,medium,high_mid,high,max,low/auto,high/auto,quiet
    var fanFillMap = [0, 1, 2, 3, 4, 5, 6, 8, 2, 6, 1]; // 11 modes
    var fillCount;
    if (fi >= 0 && fi < fanFillMap.length) {
      // The mode is in the standard list → use the standard map
      fillCount = fanFillMap[fi];
    } else if (activeFanModes.length > 1) {
      // Device-defined mode → derive it proportionally from its position in the real list
      fillCount = Math.round((fi_active / (activeFanModes.length - 1)) * 8);
    } else {
      fillCount = 4;
    }
    var fanBarHtml = '';
    for (var i = 0; i < 8; i++) {
      var barOn = i < fillCount;
      fanBarHtml += '<span class="fbar' + (barOn ? ' fbar-on' : '') + '" style="height:' + barHeights[i] + 'px"></span>';
    }

    // Fan icon SVG - slender swept blades on a visible hub, animated while running
    var fanIconSvg = (function() {
      // `isOn` and `fanMode` come from the enclosing render scope
      var color = 'var(--accent)';
      // The viewBox is dim x dim on purpose. The old one was "0 0 42 42" while
      // the blades were drawn around 17,17 and the hub around 21,21 -- two
      // centres inside the same 34px box, so the blades orbited the hub instead
      // of covering it and the whole glyph read as off-centre. One box, one
      // centre: dim/2, which is also the element centre and the origin the
      // spin uses, so the two can no longer disagree.
      var dim = 34;
      var cx = dim / 2, cy = dim / 2;
      var HUB_R = 4.5, CAP_R = 1.7;      // hub ring + centre cap
      var ROOT = 3.9, TIP = 15.1;        // blade root / tip radius
      var W_ROOT = 0.44, W_TIP = 0.115;  // half-angle (rad): wide at the hub, thin at the tip
      var SWEEP = 0.60;                  // how far a blade leans as it goes out
      var LEAN = 0.80;                   // leading edge is narrower -- not a symmetric petal
      var SAMPLES = 12;                  // points per edge
      function polar(r, a) {
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      }
      // One blade, sampled along both edges. Straight segments are smooth
      // enough at 34px and cannot drift away from the numbers that drew them.
      function blade(angDeg) {
        var base = (angDeg - 90) * Math.PI / 180;
        var d = '', i, t, r, w, p;
        for (i = 0; i <= SAMPLES; i++) {            // out along the trailing edge
          t = i / SAMPLES;
          r = ROOT + (TIP - ROOT) * t;
          w = W_ROOT + (W_TIP - W_ROOT) * t;
          p = polar(r, base + SWEEP * t + w);
          d += (i ? ' L ' : 'M ') + p[0].toFixed(2) + ' ' + p[1].toFixed(2);
        }
        for (i = SAMPLES; i >= 0; i--) {            // and back along the leading edge
          t = i / SAMPLES;
          r = (ROOT + (TIP - ROOT) * t) * (1 - 0.03 * t);
          w = (W_ROOT + (W_TIP - W_ROOT) * t) * LEAN;
          p = polar(r, base + SWEEP * t - w);
          d += ' L ' + p[0].toFixed(2) + ' ' + p[1].toFixed(2);
        }
        return d + ' Z';
      }
      // Six blades, always. The old table grew the blade count with the speed
      // setting (3 -> 5); more blades read as a different fan, not a faster
      // one. Speed is already carried by the spin period and the bar gauge.
      var BLADE_COUNT = 6;
      var blades = '';
      for (var b = 0; b < BLADE_COUNT; b++) {
        blades += '<path d="' + blade(b * (360 / BLADE_COUNT)) + '" fill="' + color + '"'
          + ' fill-opacity="0.26" stroke="' + color + '" stroke-width="1.05"'
          + ' stroke-linejoin="round"/>';
      }
      // Spin whenever the unit is running; the period follows the level name.
      // acFanSpinDuration() already includes the "s" unit.
      var animStyle = isOn
        ? 'style="transform-box:view-box;transform-origin:50% 50%;animation:fanSpin ' + acFanSpinDuration(fanMode) + ' linear infinite"'
        : '';
      return '<svg width="' + dim + '" height="' + dim + '" viewBox="0 0 ' + dim + ' ' + dim + '" ' + animStyle + '>'
        + '<defs><filter id="fanGlow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
        + '<g filter="url(#fanGlow)">' + blades + '</g>'
        + '<circle cx="' + cx + '" cy="' + cy + '" r="' + HUB_R + '" fill="none" stroke="' + color + '" stroke-width="1.3"/>'
        + '<circle cx="' + cx + '" cy="' + cy + '" r="' + CAP_R + '" fill="' + color + '" fill-opacity="0.95"/>'
        + '</svg>';
    })();
    var swingState = acSwingIconState(swingMode, 'v');
    var sColor = swingState.on ? 'var(--accent)' : 'rgba(255,255,255,0.3)';
    var sOp    = swingState.on ? '1' : '0.5';
    var swingSvg = acSwingIconSvg(swingState, 'v', sColor, sOp, 'swing-ico-svg');

    var swingBtn = '<button class="swing-btn" id="btn-swing">'
      + swingSvg
      + acValueLine(swingCurrentLabel, tr.swingLabel)
      + '</button>';

    // Horizontal swing button — only when the entity supports it
    var hswingBtn = '';
    if (hasHswing) {
      var hswingState = acSwingIconState(hswingMode, 'h');
      var hColor = hswingState.on ? 'var(--accent)' : 'rgba(255,255,255,0.3)';
      var hOp    = hswingState.on ? '1' : '0.5';
      var hSvg = acSwingIconSvg(hswingState, 'h', hColor, hOp, 'swing-ico-svg swing-h');
      hswingBtn = '<button class="swing-btn" id="btn-hswing">' + hSvg
        + acValueLine(hswingLabel, tr.hswingLabel || 'Left-right') + '</button>';
    }

    // Room tabs
    var roomTabs = '';
    for (var j = 0; j < ROOMS.length; j++) {
      var rState = this._s(ROOMS[j].id);
      var rOffline = (rState === 'unavailable' || rState === 'unknown');
      // When offline, treat it as off for the tab display
      if (rOffline) rState = 'off';
      var ron = rState !== 'off';
      var rTemp = parseFloat(this._a(ROOMS[j].id, 'current_temperature') || 0);
      // Override rTemp from per-room sensor if configured (for room-tab temperature display)
      var _rEntCfgJ = (cfg.entities && cfg.entities[j]) || {};
      if (_rEntCfgJ.temp_entity && this._hass && this._hass.states[_rEntCfgJ.temp_entity]) {
        var _rSensorTemp = parseFloat(this._hass.states[_rEntCfgJ.temp_entity].state);
        if (!isNaN(_rSensorTemp) && _rSensorTemp > 0) {
          rTemp = _rSensorTemp;
        }
      }
      var rHaUnit = rTemp > 50 ? 'F' : 'C';
      var rTempDisp = rTemp > 0 ? acTempWithUnit(rTemp, tUnit, rHaUnit) : '--';
      var rTempStr = rTempDisp;

      // ── Read the room humidity (per-room sensor or global) ──
      var rHumRaw = NaN;
      var rEntCfgJ = (cfg.entities && cfg.entities[j]) || {};
      if (rEntCfgJ.humidity_entity && this._hass && this._hass.states[rEntCfgJ.humidity_entity]) {
        rHumRaw = parseFloat(this._hass.states[rEntCfgJ.humidity_entity].state);
      } else if (this._a(ROOMS[j].id, 'current_humidity')) {
        rHumRaw = parseFloat(this._a(ROOMS[j].id, 'current_humidity'));
      }

      // ── Build the smart tooltip from temperature + humidity + state ──
      var tipMsg = '';
      var tipColor = 'rgba(255,255,255,0.88)';
      var tipEmoji = '';
      var tipSaysHumidity = false;
      var rTD = rTemp > 0 ? acTempWithUnit(rTemp, tUnit, rHaUnit) : '';
      var rTempC = rHaUnit === 'F' ? acFtoC(rTemp) : rTemp;
      if (rTemp > 0) {
        var tHot  = 32, tWarm = 29, tCool = 24, tCold = 18;
        if (!ron) {
          if (rTempC >= tHot) {
            tipEmoji = '🥵'; tipMsg = tr.tips.hot(rTD);
            tipColor = '#fca5a5';
          } else if (rTempC >= tWarm) {
            tipEmoji = '☀️'; tipMsg = tr.tips.warm(rTD);
            tipColor = '#fdba74';
          } else if (rTempC <= tCold) {
            tipEmoji = '🥶'; tipMsg = tr.tips.cold(rTD);
            tipColor = '#93c5fd';
          } else if (!isNaN(rHumRaw) && rHumRaw >= 75) {
            tipEmoji = '💧'; tipMsg = tr.tips.humid(Math.round(rHumRaw)); tipSaysHumidity = true;
            tipColor = '#c4b5fd';
          } else {
            tipEmoji = '✅'; tipMsg = tr.tips.comfy(rTD);
            tipColor = '#86efac';
          }
        } else {
          if (rState === 'cool') {
            if (rTempC > 28) {
              tipEmoji = '❄️'; tipMsg = tr.tips.coolHigh(rTD);
              tipColor = '#7dd3fc';
            } else if (rTempC <= tCool) {
              tipEmoji = '😌'; tipMsg = tr.tips.coolNice(rTD);
              tipColor = '#6ee7b7';
            } else {
              tipEmoji = '❄️'; tipMsg = tr.tips.coolAlmost(rTD);
              tipColor = '#93c5fd';
            }
          } else if (rState === 'heat') {
            tipEmoji = '🔥'; tipMsg = tr.tips.heating(rTD);
            tipColor = '#fca5a5';
          } else if (rState === 'dry') {
            tipEmoji = '💨'; tipMsg = !isNaN(rHumRaw) ? tr.tips.dryingH(Math.round(rHumRaw)) : tr.tips.drying();
            tipSaysHumidity = true;
            tipColor = '#c4b5fd';
          } else if (rState === 'fan_only') {
            tipEmoji = '🌬️'; tipMsg = tr.tips.fan(rTD);
            tipColor = '#86efac';
          }
        }
        if (!isNaN(rHumRaw) && rHumRaw >= 80 && rState !== 'dry' && !tipSaysHumidity) {
          tipMsg += tr.tips.humidHigh(Math.round(rHumRaw));
        }
      } else {
        tipMsg = tr.tips.noTemp();
        tipColor = 'rgba(255,255,255,0.5)';
      }
      var tipHtml = tipMsg
        ? '<span class="room-tab-tip" style="color:' + tipColor + '">' + tipEmoji + ' ' + tipMsg + '</span>'
        : '';
      var isActive = j === this._activeIdx;
      var tabClass = 'room-tab'
        + (isActive && ron  ? ' room-tab--active room-tab--on'  : '')
        + (isActive && !ron ? ' room-tab--active room-tab--off' : '')
        + (!isActive && ron ? ' room-tab--running' : '');
      var rMode = this._s(ROOMS[j].id);
      var rModeCfg = MODE_CFG[rMode] || MODE_CFG.cool;
      var tabIconColor = ron ? rModeCfg.color : 'rgba(255,255,255,0.55)';

      // ── Temperature progress background ──────────────────────────────────
      // While the unit is on, show a background progress bar filling left to right
      // Progress reaches 100% when the actual temperature hits the set temperature
      var rSetTemp = parseFloat(this._a(ROOMS[j].id, 'temperature') || 0);
      var tabProgressStyle = '';
      if (ron && rSetTemp > 0 && rTemp > 0) {
        // Pick the progress colour from the mode
        var progressColor = rModeCfg.color || 'rgba(0,200,255,0.9)';
        // Convert hex/rgb to rgba with a low opacity for the background
        var progressBg = progressColor;
        // Parse the colour to build a semi-transparent rgba
        var hexMatch = progressColor.match(/^#([0-9a-f]{6})$/i);
        if (hexMatch) {
          var hr = parseInt(hexMatch[1].substring(0,2),16);
          var hg = parseInt(hexMatch[1].substring(2,4),16);
          var hb = parseInt(hexMatch[1].substring(4,6),16);
          progressBg = 'rgba(' + hr + ',' + hg + ',' + hb + ',0.22)';
        } else {
          // fallback: use color-mix or a default rgba
          progressBg = progressColor.replace('rgb(','rgba(').replace(')',',0.22)');
        }

        var progressPct = 0;
        if (rMode === 'cool' || rMode === 'auto') {
          // Cooling: progress runs from (setTemp+10°C) down to setTemp
          // curTemp >= setTemp+10 → 0%, curTemp = setTemp → 100%
          var coolHigh = rSetTemp + 10;
          progressPct = Math.max(0, Math.min(100, (1 - (rTemp - rSetTemp) / 10) * 100));
          if (rTemp <= rSetTemp) progressPct = 100;
          if (rTemp >= coolHigh) progressPct = 0;
        } else if (rMode === 'heat') {
          // Heat: progress runs from (setTemp-10°C) up to setTemp
          var heatLow = rSetTemp - 10;
          progressPct = Math.max(0, Math.min(100, (1 - (rSetTemp - rTemp) / 10) * 100));
          if (rTemp >= rSetTemp) progressPct = 100;
          if (rTemp <= heatLow) progressPct = 0;
        } else {
          // Dry / fan_only: fixed at 60%
          progressPct = 60;
        }

        // Inline background: progress left to right, fading as it goes
        // The border comes from the CSS class and is untouched; only the background changes
        tabProgressStyle = 'background:linear-gradient(to right,'
          + progressBg + ' 0%,'
          + progressBg + ' ' + progressPct.toFixed(1) + '%,'
          + 'transparent ' + progressPct.toFixed(1) + '%,'
          + 'transparent 100%);';
      }

      // When offline: grey icon, no progress bar, OFFLINE badge
      if (rOffline) {
        tabIconColor = 'rgba(255,255,255,0.3)';
        tabProgressStyle = '';
      }

      roomTabs += '<button class="' + tabClass + '" data-room="' + j + '" data-tip="' + (tipMsg ? tipEmoji + ' ' + tipMsg : '') + '" data-tip-color="' + tipColor + '"'
        + (tabProgressStyle ? ' style="' + tabProgressStyle + '"' : '') + '>'
        + '<span class="room-tab-ico">' + this._mdiIcon(ROOMS[j].icon, 20, tabIconColor) + '</span>'
        + '<span class="room-tab-info">'
        + '  <span class="room-tab-name">' + escHtml(ROOMS[j].label) + '</span>'
        + '  <span class="room-tab-temp">' + (rOffline ? tr.offlineShort : rTempStr) + '</span>'
        + (rOffline ? '' :
            '  <span class="room-tab-meta">'
              + acFanLabel(tr, this._a(ROOMS[j].id, 'fan_mode') || 'auto') + ' · '
              + acSwingLabel(tr, this._a(ROOMS[j].id, 'swing_mode') || 'off', swingLabels)
            + '</span>')
        + '</span>'
        + (rOffline
            ? '<span class="room-status-badge rsb-offline">' + tr.badgeOffline + '</span>'
            : '<span class="room-status-badge ' + (ron ? 'rsb-on' : 'rsb-off') + '">' + (ron ? tr.badgeOn : tr.badgeOff) + '</span>')
        + '</button>';
    }

    // Mode buttons — filtered by show_cool / show_heat / show_dry / show_fan_only / show_auto
    var modeKeys = ['auto','cool','heat','dry','fan_only'];
    var modeShowMap = { auto: 'show_auto', cool: 'show_cool', heat: 'show_heat', dry: 'show_dry', fan_only: 'show_fan_only' };
    var modeBtns = '';
    for (var m = 0; m < modeKeys.length; m++) {
      var mk = modeKeys[m];
      // auto is hidden by default (only shown when show_auto === true)
      if (mk === 'auto' && cfg.show_auto !== true) continue;
      if (mk !== 'auto' && cfg[modeShowMap[mk]] === false) continue;
      var mc = Object.assign({}, MODE_CFG[mk], { lbl: tr.modes[mk] || MODE_CFG[mk].lbl });
      var act = hvac === mk;
      var st  = act ? ('--bc:' + mc.color + ';--bg:' + mc.glow + ';') : '';
      var modeIconColor = act ? mc.color : '#ffffff';
      var modeIconHtml = (mc.icon && mc.icon.indexOf('mdi:') === 0)
        ? '<ha-icon icon="' + mc.icon + '" style="--mdc-icon-size:22px;--mdc-icon-color:' + modeIconColor + ';width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;color:' + modeIconColor + '"></ha-icon>'
        : '<span style="font-size:18px;line-height:1;vertical-align:middle">' + mc.icon + '</span>';
      modeBtns += '<button class="mode-btn' + (act ? ' mode-btn--active' : '') + '" data-hvac="' + mk + '" style="' + st + '">'
        + '<span class="dock-tooltip">' + mc.lbl + '</span>'
        + '<span class="mode-icon">' + modeIconHtml + '</span>'
        + '<span class="mode-lbl">' + mc.lbl + '</span>'
        + '</button>';
    }

    var comfortTxt = acComfortText(tr, hvac, curTempC, setTempC);
    var modeChipIcon = (mode.icon && mode.icon.indexOf('mdi:') === 0)
      ? '<ha-icon icon="' + mode.icon + '" style="--mdc-icon-size:14px;--mdc-icon-color:' + mode.color + ';width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;color:' + mode.color + '"></ha-icon>'
      : '<span style="font-size:12px;line-height:1;vertical-align:middle">' + mode.icon + '</span>';
    var modeChip = isOn ? ('<span class="ac-mode-chip">' + modeChipIcon + ' ' + mode.lbl + '</span>') : '';

    var pwClass = isOn ? 'pw-on' : 'pw-off';
    var _pwMc = (isOn && MODE_CFG[hvac]) ? MODE_CFG[hvac] : null;
    var _pwColor = _pwMc ? _pwMc.color : '#3b9eff';
    var _pwGlow  = _pwMc ? _pwMc.glow  : 'rgba(59,158,255,0.7)';
    var pwStyle = isOn && _pwMc ? ('--pw-color1:' + _pwColor + ';--pw-color2:' + _pwColor + ';--pw-glow:' + _pwGlow + ';') : '';
    var entityState = this._hass && this._hass.states && this._hass.states[room.id] ? this._hass.states[room.id].state : 'unknown';
    var wifiOk = entityState !== 'unknown' && entityState !== 'unavailable';
    var wifiColor = wifiOk ? '#34d399' : 'rgba(255,255,255,0.4)';
    var wifiGlow  = wifiOk ? 'drop-shadow(0 0 4px #34d399)' : 'none';
    var pwSub   = isUnavailable
      ? tr.offlineDevice
      : (isOn ? tr.tapOff : tr.tapOn);

    // Sensor readings for the status block. The VALUES come from
    // acSensorStripValues() -- the very function the 10s live patch calls --
    // so the first paint and every later update cannot format the same
    // reading two different ways. That happened once: the first paint built
    // its own strings and the patch built them again, and the indoor chip
    // visibly grew a "°C" ten seconds after the card loaded.
    // That function also owns the show_* flags and the "no usable reading ->
    // hide the cell" rule, so one place decides what a reading is allowed to
    // say. It reads the OUTDOOR entities only; the room's own sensors are
    // still read by the room card, the room tabs and the Super Lite row, but
    // they no longer appear in this strip.
    var _sv = acSensorStripValues(this, cfg, room, tUnit);
    var _sens = [];
    if (_sv['out-temp'] !== null) _sens.push(['&#127777;', _sv['out-temp'], 'out-temp']);
    if (_sv['out-hum'] !== null)  _sens.push(['&#128167;', _sv['out-hum'],  'out-hum']);
    // PM2.5 is NOT a chip: it has its own ring beside the status text, which is
    // where the user has it. Listing it here as well would print the same
    // number twice, in two different styles, a few centimetres apart.
    // The PM2.5 ring, restored. It renders only when the sensor reports a real
    // number: a ring showing "--" is worse than no ring, because a circle
    // around nothing still reads as a gauge.
    var pmRingHtml = (cfg.show_pm25 !== false && _sv['pm25'] !== null)
      ? '<div class="pm-ring"><div class="pm-val">' + _sv['pm25'] + '</div>'
        + '<div class="pm-unit">' + tr.dustLabel + '</div></div>'
      : '';
    // Icon + value only, matching the approved screenshot. The indoor/outdoor
    // word that used to sit here made each pill wide enough that two of them
    // filled the whole strip, and the reference has no room for it.
    var sensChipsHtml = _sens.length
      ? '<div class="sens-row">' + _sens.map(function(s) {
          return '<div class="sens" data-sens="' + s[2] + '"><span class="sens-ico">' + s[0] + '</span>'
               + '<span class="sens-val">' + s[1] + '</span></div>';
        }).join('') + '</div>'
      : '';

    var powerUnit = cfg.power_unit || 'kw';
    // The power reading is resolved in the Super Lite block below, where it is
    // actually rendered. This preamble computed powerVal and nothing ever read
    // it, which is why the editor's "Power (kW)" switch and the global
    // power_entity field both looked configurable and did nothing.

    // ── SUPER LITE MODE ──────────────────────────────────────────────────────
    var isSuperLite = this._config.view_mode === 'super_lite';
    if (isSuperLite) {
      var slModeKeys = ['auto','cool','heat','dry','fan_only'];
      var slModeShowMap = { auto: 'show_auto', cool: 'show_cool', heat: 'show_heat', dry: 'show_dry', fan_only: 'show_fan_only' };
      var slModeOptions = '<option value="off">' + (tr.modes['off'] || 'Off') + '</option>';
      for (var sm = 0; sm < slModeKeys.length; sm++) {
        var smk = slModeKeys[sm];
        if (smk === 'auto' && cfg.show_auto !== true) continue;
        if (smk !== 'auto' && cfg[slModeShowMap[smk]] === false) continue;
        var smc = Object.assign({}, MODE_CFG[smk], { lbl: tr.modes[smk] || MODE_CFG[smk].lbl });
        // The dock draws the mdi modes as <ha-icon> and the emoji ones as text,
        // so the Super Lite dropdown has to translate the mdi names or it would
        // print the literal string into an <option>.
        var smcOptIcon = (smc.icon && smc.icon.indexOf('mdi:') === 0)
          ? ({ 'mdi:snowflake':'❄', 'mdi:autorenew':'🔄' }[smc.icon] || '●')
          : smc.icon;
        slModeOptions += '<option value="' + smk + '"' + (hvac === smk ? ' selected' : '') + '>' + smcOptIcon + ' ' + smc.lbl + '</option>';
      }
      var slIsOn = hvac !== 'off';
      // Outdoor sensors for super lite
      var _slOutNum = acSensorNum(cfg.outdoor_temp_entity ? this._hass.states[cfg.outdoor_temp_entity] : null);
      var slOutdoorTemp = _slOutNum === null ? null
        : acTempWithUnit(_slOutNum, tUnit, _slOutNum > 50 ? 'F' : 'C');
      // Same resolution as acSensorStripValues: the new key first, the legacy
      // name as the fallback. Reading only the legacy name here meant a user who
      // filled in the editor's "outdoor humidity" field -- which writes the new
      // key -- saw a reading in Full/Lite and nothing at all in Super Lite.
      var _slHumEnt = cfg.outdoor_humidity_entity || cfg.humidity_entity;
      var _slHumNum = acHumidityNum(_slHumEnt ? this._hass.states[_slHumEnt] : null);
      var slHumidity = _slHumNum === null ? null : Math.round(_slHumNum) + '%';

      // Room env override: when show_room_env is on → use the selected room's temperature/humidity
      var slRoomCfg = (cfg.entities && cfg.entities[this._activeIdx]) || {};
      var slShowRoomEnv = cfg.show_room_env === true;
      var slEnvTemp, slEnvHumidity, slEnvIsRoom;
      if (slShowRoomEnv) {
        // Room temperature: prefer the dedicated sensor, fall back to the entity's current_temperature
        var roomEntCfgSL = (cfg.entities && cfg.entities[this._activeIdx]) || {};
        var roomTempSL = curTemp; // curTemp was computed from the sensor/entity above
        var roomHumSL  = roomHumidityRaw; // roomHumidityRaw was computed above
        slEnvTemp     = roomTempSL > 0 ? acTempWithUnit(roomTempSL, tUnit, roomTempSL > 50 ? 'F' : 'C') : null;
        slEnvHumidity = roomHumSL  > 0 ? Math.round(roomHumSL) + '%'  : null;
        slEnvIsRoom   = true;
      } else {
        slEnvTemp     = slOutdoorTemp;
        slEnvHumidity = slHumidity;
        slEnvIsRoom   = false;
      }
      // Inner current-temp ring — uses curTempC (the real reading), same as Full/Lite
      var slCurPct    = Math.max(0, Math.min(1, (curTempC - 16) / 16));
      // Dynamic dot color for inner SL arc endpoint — interpolate blue→green→orange→red
      var _slItPct = slCurPct;
      var slInnerDotColor = _slItPct < 0.25 ? '#3b9eff'
                          : _slItPct < 0.5  ? '#34d399'
                          : _slItPct < 0.75 ? '#fb923c'
                          : '#ef4444';
      var slSetArcEnd = -140 + slCurPct * 280;
      var slInnerTrack   = this._arc(110,110,76,-140,140);
      var slInnerArcFill = slCurPct > 0.02 ? this._arc(110,110,76,-140,slSetArcEnd) : '';
      var slSetDotRad = (slSetArcEnd - 90) * Math.PI / 180;
      var slSetDotX   = (110 + 76 * Math.cos(slSetDotRad)).toFixed(1);
      var slSetDotY   = (110 + 76 * Math.sin(slSetDotRad)).toFixed(1);

      // Build room dropdown button label + popup items
      var slRoomBtnLabel = '';
      var slRoomPopupItems = '';
      for (var sri = 0; sri < ROOMS.length; sri++) {
        var sriState = this._s(ROOMS[sri].id);
        var sriOffline = (sriState === 'unavailable' || sriState === 'unknown');
        if (sriOffline) sriState = 'off';
        var sriOn    = sriState !== 'off';
        var sriTemp  = parseFloat(this._a(ROOMS[sri].id, 'current_temperature') || 0);
        var sriHaUnit = sriTemp > 50 ? 'F' : 'C';
        var sriTempStr = sriTemp > 0 ? ' · ' + acTempWithUnit(sriTemp, tUnit, sriHaUnit) : '';
        var sriHumRaw = parseFloat(this._a(ROOMS[sri].id, 'current_humidity') || this._a(ROOMS[sri].id, 'humidity') || 0);
        var sriEntCfgH = (cfg.entities && cfg.entities[sri]) || {};
        if (sriEntCfgH.humidity_entity && this._hass && this._hass.states[sriEntCfgH.humidity_entity]) {
          var sriHumSensor = parseFloat(this._hass.states[sriEntCfgH.humidity_entity].state);
          if (!isNaN(sriHumSensor)) sriHumRaw = sriHumSensor;
        }
        var sriHumStr = sriHumRaw > 0 ? ' · 💧' + Math.round(sriHumRaw) + '%' : '';
        var sriIconColor = sriOn ? (MODE_CFG[sriState] || MODE_CFG.cool).color : 'rgba(255,255,255,0.55)';
        var sriIconHtml = this._mdiIcon(ROOMS[sri].icon, 18, sriIconColor);
        var sriLabelText = escHtml(ROOMS[sri].label) + sriTempStr + sriHumStr;
        if (sri === this._activeIdx) slRoomBtnLabel = sriIconHtml + ' ' + sriLabelText;
        slRoomPopupItems += '<div class="sl-room-item' + (sri === this._activeIdx ? ' active' : '') + '" data-room-idx="' + sri + '">'
          + '<span style="flex:1;display:flex;align-items:center;gap:6px">' + sriIconHtml + '<span>' + sriLabelText + '</span></span>'
          + '<span class="sl-room-item-badge ' + (sriOffline ? 'offline' : (sriOn ? 'on' : 'off')) + '">' + (sriOffline ? tr.badgeOffline : (sriOn ? tr.badgeOn : tr.badgeOff)) + '</span>'
          + '</div>';
      }
      this._slRoomPopupItems = slRoomPopupItems;

      var isDeepNeonSL = (cfg.background_preset === 'deep_neon');
      var slShowFan   = cfg.show_sl_fan   !== false;
      var slShowSwing = cfg.show_sl_swing !== false;
      var slCompact   = slShowFan || slShowSwing;
      var slFanLabelIdx = FAN_LEVELS.indexOf(fanMode);
      // Prefer the label from the standard FAN_LEVELS; if the device uses its own name, show it as-is
      var slFanLabel  = acFanLabel(tr, fanMode);
      var slSwingLabel = swingCurrentLabel;

      // ── Room power per-room ──────────────────────────────────────────────────
      // Both switches gate this row: show_sl_room_power is the Super Lite
      // control, show_power is the global one. Previously only the first was
      // read anywhere and the second appeared nowhere except its own editor
      // row, so flipping it did nothing.
      var slShowRoomPower = cfg.show_sl_room_power !== false && cfg.show_power !== false;
      var slPowerUnit = cfg.power_unit || 'kw'; // 'kw' | 'w'
      var slRoomPowerRaw = null;
      var roomEntCfgPow = (cfg.entities && cfg.entities[this._activeIdx]) || {};
      // Per-room sensor first, then the global one -- which is the only thing
      // the global power_entity field ever fed.
      var slPowerEnt = roomEntCfgPow.power_entity || cfg.power_entity;
      if (slPowerEnt && this._hass && this._hass.states[slPowerEnt]) {
        slRoomPowerRaw = acFmtPower(
          this._hass.states[slPowerEnt].state,
          this._a(slPowerEnt, 'unit_of_measurement'),
          slPowerUnit);
      }
      var _customCssVarsSL = '';
      if (cfg.color_temp_val)     _customCssVarsSL += '--cv-temp:' + cfg.color_temp_val + ';';
      if (cfg.color_comfort)      _customCssVarsSL += '--cv-comfort:' + cfg.color_comfort + ';';
      if (cfg.color_room_on)      _customCssVarsSL += '--cv-room-on:' + cfg.color_room_on + ';';
      if (cfg.color_room_off)     _customCssVarsSL += '--cv-room-off:' + cfg.color_room_off + ';';
      if (cfg.color_title)        _customCssVarsSL += '--cv-title:' + cfg.color_title + ';';
      if (cfg.color_greet_sub)    _customCssVarsSL += '--cv-greet-sub:' + cfg.color_greet_sub + ';';
      if (cfg.color_greet_name)   _customCssVarsSL += '--cv-greet-name:' + cfg.color_greet_name + ';';
      if (cfg.color_dial_lbl)     _customCssVarsSL += '--cv-dial-lbl:' + cfg.color_dial_lbl + ';';
      if (cfg.color_temp_set)     _customCssVarsSL += '--cv-temp-set:' + cfg.color_temp_set + ';';
      if (cfg.color_eta)          _customCssVarsSL += '--cv-eta:' + cfg.color_eta + ';';
      if (cfg.color_mode_lbl)     _customCssVarsSL += '--cv-mode-lbl:' + cfg.color_mode_lbl + ';';
      if (cfg.color_fc_label)     _customCssVarsSL += '--cv-fc-label:' + cfg.color_fc_label + ';';
      if (cfg.color_fc_val)       _customCssVarsSL += '--cv-fc-val:' + cfg.color_fc_val + ';';
      if (cfg.color_swing_lbl)    _customCssVarsSL += '--cv-swing-lbl:' + cfg.color_swing_lbl + ';';
      if (cfg.color_room_header)  _customCssVarsSL += '--cv-room-header:' + cfg.color_room_header + ';';
      if (cfg.color_room_name)    _customCssVarsSL += '--cv-room-name:' + cfg.color_room_name + ';';
      if (cfg.color_st_title)     _customCssVarsSL += '--cv-st-title:' + cfg.color_st_title + ';';
      if (cfg.color_st_sub)       _customCssVarsSL += '--cv-st-sub:' + cfg.color_st_sub + ';';
      // One escape for the whole string instead of 18 edits: any quote in a
      // colour value would otherwise close this style attribute. It has to run
      // BEFORE slHtml is assembled -- this string is consumed on the next line.
      _customCssVarsSL = escHtml(_customCssVarsSL);
      var slHtml = '<div class="card card--super-lite' + (isDeepNeonSL ? ' card--deep-neon' : '') + '" style="--accent:' + mode.color + ';--glow:' + mode.glow + ';background:' + bgGrad + ';' + bgBlurStyle + _customCssVarsSL + '">'
        + '<div class="sl-body">'
        // ── Header: title + sensors + wifi + gear + status badge
        + '<div class="sl-hdr">'
        + '  <div style="display:flex;flex-direction:column;gap:2px">'
        + '    <span class="sl-title">' + tr.greet() + ' ' + escHtml(cfg.owner_name || tr.cardSub) + '</span>'
        + (!slEnvIsRoom ? '    <span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:600;margin-bottom:1px">&#127777; ' + (tr.outdoorLabel || 'Outdoor') + '</span>' : '')
        + (slEnvTemp || slEnvHumidity || (slShowRoomPower && slRoomPowerRaw) ? (
            '    <span style="display:flex;gap:8px;align-items:center">'
          + (slEnvTemp     ? '<span style="font-size:13px;color:rgba(255,255,255,' + (slEnvIsRoom ? '0.9' : '0.65') + ');font-family:\'Orbitron\',sans-serif;font-weight:600">' + (slEnvIsRoom ? '&#127968;' : '&#127777;') + ' ' + slEnvTemp + '</span>' : '')
          + (slEnvHumidity ? '<span style="font-size:13px;color:rgba(255,255,255,' + (slEnvIsRoom ? '0.75' : '0.55') + ');font-family:\'Orbitron\',sans-serif;font-weight:600">&#128167; ' + slEnvHumidity + '</span>' : '')
          + (slShowRoomPower && slRoomPowerRaw ? '<span style="font-size:13px;color:rgba(255,255,255,0.7);font-family:\'Orbitron\',sans-serif;font-weight:600">&#9889; ' + slRoomPowerRaw + '</span>' : '')
          + '    </span>'
          ) : '')
        + '  </div>'
        + '  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'
        + '    <div style="display:flex;align-items:center;gap:10px">'
        + '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + wifiColor + '" stroke-width="1.8" style="filter:' + wifiGlow + ';flex-shrink:0"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>'
        + '      <button id="sl-btn-gear" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;line-height:0">'
        + '        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
        + '      </button>'
        + '      <span class="sl-badge">'
        + '        <span class="sl-led ' + (isUnavailable ? 'sl-led-off' : (slIsOn ? 'sl-led-on' : 'sl-led-off')) + '" style="' + (isUnavailable ? 'background:#f87171;box-shadow:0 0 8px #f87171;animation:offlinePulse 2s ease-in-out infinite' : '') + '"></span>'
        + '        <span class="sl-badge-txt" style="' + (isUnavailable ? 'color:#f87171' : '') + '">' + (isUnavailable ? 'OFFLINE' : (slIsOn ? tr.statusOn : tr.statusOff)) + '</span>'
        + '      </span>'
        + '    </div>'
        + '    <div style="display:flex;align-items:center;gap:3px">'
        + '      <button class="sl-vs-btn' + (cfg.view_mode !== 'super_lite' && cfg.view_mode !== 'lite' ? ' sl-vs-btn--active' : '') + '" id="sl-vs-full" title="Full"><svg width="20" height="8" viewBox="0 0 20 8"><circle cx="2" cy="4" r="2.2" fill="currentColor"/><circle cx="10" cy="4" r="2.2" fill="currentColor"/><circle cx="18" cy="4" r="2.2" fill="currentColor"/></svg></button>'
        + '      <button class="sl-vs-btn' + (cfg.view_mode === 'lite' ? ' sl-vs-btn--active' : '') + '" id="sl-vs-lite" title="Lite"><svg width="14" height="8" viewBox="0 0 14 8"><circle cx="2" cy="4" r="2.2" fill="currentColor"/><circle cx="10" cy="4" r="2.2" fill="currentColor"/></svg></button>'
        + '      <button class="sl-vs-btn' + (cfg.view_mode === 'super_lite' ? ' sl-vs-btn--active' : '') + '" id="sl-vs-superlite" title="Super Lite"><svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="2.2" fill="currentColor"/></svg></button>'
        + '    </div>'
        + '  </div>'
        + '</div>'

        // ── Dial — larger (240px), with inner set-temp ring
        + '<div class="sl-dial-wrap">'
        + '<svg width="240" height="240" viewBox="0 0 220 220" style="overflow:visible">'
        + '<defs>'
        + '<filter id="arcGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '<filter id="dotGlow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '<filter id="innerArcGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        + '<linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3b9eff"/><stop offset="50%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>'
        + '<linearGradient id="innerTempGrad" x1="22" y1="110" x2="198" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#3b9eff"/><stop offset="40%" stop-color="#34d399"/><stop offset="70%" stop-color="#fb923c"/><stop offset="100%" stop-color="#ef4444"/></linearGradient>'
        + '<radialGradient id="innerGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="' + mode.color + '" stop-opacity="0.25"/><stop offset="100%" stop-color="' + mode.color + '" stop-opacity="0"/></radialGradient>'
        + '</defs>'
        + '<circle cx="110" cy="110" r="72" fill="rgba(180,220,255,0.25)" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>'
        + '<circle cx="110" cy="110" r="68" fill="url(#innerGlow)"/>'
        + '<path data-ring="outer" d="' + arcTrack + '" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12" stroke-linecap="round"/>'
        + ticks
        + arcFillSvg
        + dotSvg
        // inner set-temp ring
        + '<path data-ring="inner" d="' + slInnerTrack + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4" stroke-linecap="round"/>'
        + (slCurPct > 0.02 ? '<path data-ring="inner" d="' + slInnerArcFill + '" fill="none" stroke="url(#innerTempGrad)" stroke-width="4" stroke-linecap="round" filter="url(#innerArcGlow)" opacity="0.9"/>' : '')
        + (slCurPct > 0.02 ? '<circle data-ring="inner" cx="' + slSetDotX + '" cy="' + slSetDotY + '" r="4" fill="' + slInnerDotColor + '" filter="url(#innerArcGlow)"/><circle data-ring="inner" cx="' + slSetDotX + '" cy="' + slSetDotY + '" r="2" fill="white" opacity="0.9"/>' : '')
        + '</svg>'
        + '<div class="sl-dial-center">'
        + '  <div class="sl-temp-lbl">' + tr.tempLabel + '</div>'
        + (isUnavailable
            ? '  <div class="sl-temp-val" id="live-cur-temp" style="color:rgba(255,255,255,0.3);font-size:32px;text-shadow:none">--<span style="font-size:18px;font-weight:400;vertical-align:super;line-height:0">' + degSym + '</span></div>'
              + '  <div class="sl-temp-feel" id="live-comfort" style="color:#f87171;font-weight:600">' + tr.offlineTemp + '</div>'
            : '  <div class="sl-temp-val" id="live-cur-temp" style="color:' + acTempColor(curTempC) + ';text-shadow:0 0 30px ' + acTempColor(curTempC) + ',0 0 60px ' + acTempColor(curTempC) + '">' + curTempDisp + '<span style="font-size:22px;font-weight:400;vertical-align:super;line-height:0">' + degSym + '</span></div>'
              + '  <div class="sl-temp-feel" id="live-comfort">' + comfortTxt + '</div>')
        + '</div>'
        + '</div>'

        // ── Temp control (fan on the left, swing on the right)
        + (function() {
            if (hvac !== 'cool' || !slIsOn) return '';
            var slEta = this._calcEta(this._activeIdx, setTempC, curTempC, fanMode);
            if (!slEta) return '';
            var prefix2 = slEta.mode === 'estimated' ? '⏱~ ' : '⏱ ';
            var etaTxt2 = tr.etaText(prefix2, setTempDisp, degSym, slEta.eta);
              ;
            return '<div class="eta-bar-sl" id="live-eta">' + etaTxt2 + '</div>';
          }).call(this)
        + '<div class="sl-temp-ctrl">'
        + (slShowFan ? (
            '  <button class="sl-mini-btn sl-mini-btn--inline sl-fan-inline" id="sl-btn-fan-sl" type="button">'
          + '    <span class="sl-mini-btn-ico">&#128168;</span>'
          + '    <span class="sl-mini-btn-val">' + slFanLabel + '</span>'
          + '  </button>'
        ) : '')
        + '  <button class="sl-temp-btn" id="sl-btn-temp-down">&#8722;</button>'
        + '  <span class="sl-temp-set" id="live-set-temp">' + setTempDisp + '<span style="font-size:0.55em;vertical-align:super;">' + degSym + '</span></span>'
        + '  <button class="sl-temp-btn" id="sl-btn-temp-up">+</button>'
        + (slShowSwing ? (
            '  <button class="sl-mini-btn sl-mini-btn--inline sl-swing-inline" id="sl-btn-swing-sl" type="button">'
          + '    <span class="sl-mini-btn-ico">&#8644;</span>'
          + '    <span class="sl-mini-btn-val">' + slSwingLabel + '</span>'
          + '  </button>'
        ) : '')
        + (hasHswing ? (
            '  <button class="sl-mini-btn sl-mini-btn--inline sl-swing-inline" id="sl-btn-hswing-sl" type="button">'
          + '    <span class="sl-mini-btn-ico">&#8596;</span>'
          + '    <span class="sl-mini-btn-val">' + (hswingLabel || '') + '</span>'
          + '  </button>'
        ) : '')
        + '</div>'
        // ── Quick switch row (same behaviour as Full/Lite) ──
        + (function() {
            var slQs = (cfg.show_quick_switches === false) ? [] : acQuickSwitchesFor(tr, slRoomCfg, cfg.language);
            if (!slQs.length) return '';
            var row = '<div class="qs-row">';
            for (var k = 0; k < slQs.length; k++) {
              var q = slQs[k];
              var so = self._hass && self._hass.states && self._hass.states[q.entity_id];
              var sOn = so && so.state === 'on';
              var sOk = so && (so.state === 'on' || so.state === 'off');
              row += '<button class="qs-btn' + (sOn ? ' qs-on' : '') + (sOk ? '' : ' qs-off') + '"'
                   + ' data-qs-idx="' + k + '"' + (sOk ? '' : ' disabled')
                   + ' title="' + escHtml(q.label) + '">' + escHtml(q.label) + '</button>';
            }
            return row + '</div>';
          })()

        // ── Bottom controls: mode + room (scaled to fill the card)
        + '<div class="sl-controls">'
        + '  <div class="sl-mode-wrap">'
        + '    <div class="sl-select-lbl">&#9881; ' + (tr.modeLabel || 'MODE') + '</div>'
        + (cfg.popup_style === 'effect' || cfg.popup_style === 'wave'
          ? (    '    <button class="sl-room-btn" id="sl-mode-btn" type="button">'
               + '      <span class="sl-room-btn-txt" id="sl-mode-btn-txt">' + (MODE_CFG[hvac] ? ((MODE_CFG[hvac].icon && MODE_CFG[hvac].icon.indexOf('mdi:') === 0 ? '<ha-icon icon="' + MODE_CFG[hvac].icon + '" style="--mdc-icon-size:16px;--mdc-icon-color:' + MODE_CFG[hvac].color + ';width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;color:' + MODE_CFG[hvac].color + '"></ha-icon>' : '<span style="font-size:13px;line-height:1;vertical-align:middle">' + MODE_CFG[hvac].icon + '</span>') + ' ' + (tr.modes[hvac] || MODE_CFG[hvac].lbl)) : (tr.modes['off'] || 'Off')) + '</span>'
               + '      <svg class="sl-room-btn-arrow" id="sl-mode-btn-arrow" viewBox="0 0 10 6" fill="rgba(255,255,255,0.5)"><path d="M0 0l5 6 5-6z"/></svg>'
               + '    </button>')
          : (    '    <select class="sl-select' + (hvac !== 'off' ? ' sl-mode-active' : '') + '" id="sl-mode-select">'
               + slModeOptions
               + '    </select>'))
        + '  </div>'
        + '  <div class="sl-room-wrap" style="position:relative">'
        + '    <div class="sl-select-lbl">&#127968; ' + tr.selectRoom + '</div>'
        + (cfg.popup_style === 'effect' || cfg.popup_style === 'wave'
          ? (    '    <button class="sl-room-btn" id="sl-room-btn" type="button">'
               + '      <span class="sl-room-btn-txt" id="sl-room-btn-txt">' + slRoomBtnLabel + '</span>'
               + '      <svg class="sl-room-btn-arrow" id="sl-room-btn-arrow" viewBox="0 0 10 6" fill="rgba(255,255,255,0.5)"><path d="M0 0l5 6 5-6z"/></svg>'
               + '    </button>')
          : (    '    <select class="sl-select" id="sl-room-select">'
               + (function() {
                   var opts = '';
                   for (var ri = 0; ri < ROOMS.length; ri++) {
                     var riTemp = parseFloat(this._a(ROOMS[ri].id, 'current_temperature') || 0);
                     var riHaUnit = riTemp > 50 ? 'F' : 'C';
                     var riTempStr = riTemp > 0 ? ' · ' + acTempWithUnit(riTemp, tUnit, riHaUnit) : '';
                     var riHumRaw = parseFloat(this._a(ROOMS[ri].id, 'current_humidity') || this._a(ROOMS[ri].id, 'humidity') || 0);
                     var riEntCfgH = (cfg.entities && cfg.entities[ri]) || {};
                     if (riEntCfgH.humidity_entity && this._hass && this._hass.states[riEntCfgH.humidity_entity]) { var riHumS = parseFloat(this._hass.states[riEntCfgH.humidity_entity].state); if (!isNaN(riHumS)) riHumRaw = riHumS; }
                     var riHumStr = riHumRaw > 0 ? ' · 💧' + Math.round(riHumRaw) + '%' : '';
                     var riIconTxt = ROOMS[ri].icon && ROOMS[ri].icon.indexOf('mdi:') === 0 ? '' : (escHtml(ROOMS[ri].icon) + ' ');
                     opts += '<option value="' + ri + '"' + (ri === this._activeIdx ? ' selected' : '') + '>'
                           + riIconTxt + escHtml(ROOMS[ri].label) + riTempStr + riHumStr + '</option>';
                   }
                   return opts;
                 }).call(this)
               + '    </select>'))
        + '  </div>'
        + '</div>'

        + '</div>' // end sl-body
        + '</div>'; // end card
      var container = this.shadowRoot.getElementById('ac-card-root');
      if (!container) {
        container = document.createElement('div');
        container.id = 'ac-card-root';
        this.shadowRoot.appendChild(container);
      }
      container.innerHTML = '<div class="card-scale-wrap" id="ac-scale-wrap">' + slHtml + '</div>';
      this._initialized = true;
      this._bindSuperLite();
      if (this._applyScale) { var _slSelf = this; requestAnimationFrame(function(){ _slSelf._applyScale(); }); }
      return;
    }
    // ── END SUPER LITE ───────────────────────────────────────────────────────

    // ── No <link>/<style> here – they are injected in connectedCallback
    var isDeepNeon = (cfg.background_preset === 'deep_neon');
    // Apply the custom colour CSS variables
    var _customCssVars = '';
    if (cfg.color_temp_val)     _customCssVars += '--cv-temp:' + cfg.color_temp_val + ';';
    if (cfg.color_comfort)      _customCssVars += '--cv-comfort:' + cfg.color_comfort + ';';
    if (cfg.color_mode_active)  _customCssVars += '--cv-mode-active:' + cfg.color_mode_active + ';';
    if (cfg.color_room_on)      _customCssVars += '--cv-room-on:' + cfg.color_room_on + ';';
    if (cfg.color_room_off)     _customCssVars += '--cv-room-off:' + cfg.color_room_off + ';';
    if (cfg.color_status_on)    _customCssVars += '--cv-status-on:' + cfg.color_status_on + ';';
    if (cfg.color_status_off)   _customCssVars += '--cv-status-off:' + cfg.color_status_off + ';';
    if (cfg.color_fan_bar)      _customCssVars += '--cv-fan-bar:' + cfg.color_fan_bar + ';';
    if (cfg.color_dial_arc)     _customCssVars += '--cv-dial-arc:' + cfg.color_dial_arc + ';';
    if (cfg.color_title)        _customCssVars += '--cv-title:' + cfg.color_title + ';';
    if (cfg.color_greet_sub)    _customCssVars += '--cv-greet-sub:' + cfg.color_greet_sub + ';';
    if (cfg.color_greet_name)   _customCssVars += '--cv-greet-name:' + cfg.color_greet_name + ';';
    if (cfg.color_dial_lbl)     _customCssVars += '--cv-dial-lbl:' + cfg.color_dial_lbl + ';';
    if (cfg.color_temp_set)     _customCssVars += '--cv-temp-set:' + cfg.color_temp_set + ';';
    if (cfg.color_eta)          _customCssVars += '--cv-eta:' + cfg.color_eta + ';';
    if (cfg.color_mode_lbl)     _customCssVars += '--cv-mode-lbl:' + cfg.color_mode_lbl + ';';
    if (cfg.color_fc_label)     _customCssVars += '--cv-fc-label:' + cfg.color_fc_label + ';';
    if (cfg.color_fc_val)       _customCssVars += '--cv-fc-val:' + cfg.color_fc_val + ';';
    if (cfg.color_swing_lbl)    _customCssVars += '--cv-swing-lbl:' + cfg.color_swing_lbl + ';';
    if (cfg.color_power_lbl)    _customCssVars += '--cv-power-lbl:' + cfg.color_power_lbl + ';';
    if (cfg.color_timer_lbl)    _customCssVars += '--cv-timer-lbl:' + cfg.color_timer_lbl + ';';
    if (cfg.color_alloff_lbl)   _customCssVars += '--cv-alloff-lbl:' + cfg.color_alloff_lbl + ';';
    if (cfg.color_room_header)  _customCssVars += '--cv-room-header:' + cfg.color_room_header + ';';
    if (cfg.color_room_name)    _customCssVars += '--cv-room-name:' + cfg.color_room_name + ';';
    if (cfg.color_st_title)     _customCssVars += '--cv-st-title:' + cfg.color_st_title + ';';
    if (cfg.color_st_sub)       _customCssVars += '--cv-st-sub:' + cfg.color_st_sub + ';';
    _customCssVars = escHtml(_customCssVars);
    var html = '<div class="card' + (isLite ? ' card--lite' : '') + (isDeepNeon ? ' card--deep-neon' : '') + '" style="--accent:' + mode.color + ';--glow:' + mode.glow + ';background:' + bgGrad + ';' + bgBlurStyle + _customCssVars + '">'
+ '<div class="left' + (isLite ? ' left--lite' : '') + '">'

+ '<div class="hdr">'
+ '  <div class="hdr-brand">'
+ '    <div class="hdr-ico">' + (mode.icon && mode.icon.indexOf('mdi:') === 0 ? '<ha-icon icon="' + mode.icon + '" style="--mdc-icon-size:22px;--mdc-icon-color:' + mode.color + ';width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;color:' + mode.color + '"></ha-icon>' : '<span style="font-size:20px;line-height:1;color:' + mode.color + '">' + mode.icon + '</span>') + '</div>'
+ '    <div><div class="hdr-title">' + tr.cardTitle + '</div><div class="hdr-sub">' + tr.cardSub + '</div></div>'
+ '  </div>'
+ '  <div class="hdr-icons">'
+ '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + wifiColor + '" stroke-width="1.8" style="filter:' + wifiGlow + ';transition:all 0.4s"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>'
+ '    <button id="btn-gear" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;line-height:0">'
+ '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
+ '    </button>'
+ '  </div>'
+ '</div>'
+ '<div class="greet-row">'
+ '  <div style="' + (cfg.show_greet === false ? 'visibility:hidden;' : '') + '">'
+ '    <div class="greet-sub">' + tr.greet() + '</div>'
+ '    <div class="greet-name">' + escHtml(cfg.owner_name || 'Smart Home') + '</div>'
+ '  </div>'
+ '  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'
+ '    <div class="hdr-vs-row">'
+ '      <button class="hdr-vs-btn' + (!isLite ? ' hdr-vs-btn--active' : '') + '" id="hdr-vs-full" title="Full"><svg width="20" height="8" viewBox="0 0 20 8"><circle cx="2" cy="4" r="2.2" fill="currentColor"/><circle cx="10" cy="4" r="2.2" fill="currentColor"/><circle cx="18" cy="4" r="2.2" fill="currentColor"/></svg></button>'
+ '      <button class="hdr-vs-btn' + (isLite ? ' hdr-vs-btn--active' : '') + '" id="hdr-vs-lite" title="Lite"><svg width="14" height="8" viewBox="0 0 14 8"><circle cx="2" cy="4" r="2.2" fill="currentColor"/><circle cx="10" cy="4" r="2.2" fill="currentColor"/></svg></button>'
+ '      <button class="hdr-vs-btn" id="hdr-vs-superlite" title="Super Lite"><svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="2.2" fill="currentColor"/></svg></button>'
+ '    </div>'
+ '  </div>'
+ '</div>'

+ '<div class="dial-wrap" id="dial-wrap-main">'
+ '<div id="cool-dial-center-marker" style="position:absolute;top:50%;left:50%;width:1px;height:1px;pointer-events:none;z-index:0"></div>'
+ '<svg width="220" height="220" viewBox="0 0 220 220" style="overflow:visible">'
+ '<defs>'
+ '<filter id="arcGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
+ '<filter id="dotGlow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
+ '<filter id="innerArcGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
+ '<linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">'
+ (cfg.color_dial_arc
    ? '<stop offset="0%" stop-color="' + escHtml(cfg.color_dial_arc) + '"/><stop offset="100%" stop-color="' + escHtml(cfg.color_dial_arc) + '"/>'
    : '<stop offset="0%" stop-color="#3b9eff"/><stop offset="50%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#f59e0b"/>')
+ '</linearGradient>'
+ '<linearGradient id="innerTempGrad" x1="22" y1="110" x2="198" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#3b9eff"/><stop offset="40%" stop-color="#34d399"/><stop offset="70%" stop-color="#fb923c"/><stop offset="100%" stop-color="#ef4444"/></linearGradient>'
+ '<radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">'
+ '<stop offset="0%" stop-color="' + mode.color + '" stop-opacity="0.25"/>'
+ '<stop offset="100%" stop-color="' + mode.color + '" stop-opacity="0"/>'
+ '</radialGradient>'
+ '</defs>'
+ '<circle cx="110" cy="110" r="72" fill="rgba(180,220,255,0.25)" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>'
+ '<circle cx="110" cy="110" r="68" fill="url(#innerGlow)"/>'
+ '<path d="' + arcTrack + '" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12" stroke-linecap="round"/>'
+ ticks
+ arcFillSvg
+ dotSvg
+ '<path d="' + innerTrack + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="' + innerArcWidth + '" stroke-linecap="round"/>'
+ (setPct > 0.02 ? '<path d="' + innerArcFill + '" fill="none" stroke="' + innerArcColor + '" stroke-width="' + innerArcWidth + '" stroke-linecap="round" filter="url(#innerArcGlow)" opacity="0.9"/>' : '')
+ (setPct > 0.02 ? '<circle cx="' + innerSetDotX + '" cy="' + innerSetDotY + '" r="' + innerDotR1 + '" fill="' + innerDotColor + '" filter="url(#innerArcGlow)"/><circle cx="' + innerSetDotX + '" cy="' + innerSetDotY + '" r="' + innerDotR2 + '" fill="white" opacity="0.9"/>' : '')
+ (outerIsDrag ? '<circle id="dial-drag-zone" cx="110" cy="110" r="100" fill="transparent" style="cursor:grab" />' : '')
+ '</svg>'
+ '<div class="dial-center">'
+ '  <div class="dial-lbl">' + tr.tempLabel + '</div>'
+ (isUnavailable
    ? '  <div class="dial-temp" id="live-cur-temp" style="color:rgba(255,255,255,0.3);font-size:28px;text-shadow:none">--<span class="dial-deg">' + degSym + '</span></div>'
      + '  <div class="dial-feel" id="live-comfort" style="color:#f87171;font-weight:600">'
      + tr.offlineTemp + '</div>'
    : '  <div class="dial-temp" id="live-cur-temp" style="color:' + acTempColor(curTempC) + ';text-shadow:0 0 30px ' + acTempColor(curTempC) + ',0 0 60px ' + acTempColor(curTempC) + '">' + curTempDisp + '<span class="dial-deg">' + degSym + '</span></div>'
      + '  <div class="dial-feel" id="live-comfort">' + comfortTxt + '</div>')
+ '</div>'
+ '</div>'

+ '<div class="temp-ctrl">'
+ '  <button class="temp-btn" id="btn-temp-down">&#8722;</button>'
+ '  <span class="temp-set" id="live-set-temp">' + setTempDisp + '<span style="font-size:0.55em;vertical-align:super;">' + degSym + '</span></span>'
+ '  <button class="temp-btn" id="btn-temp-up">+</button>'
+ '</div>'
+ (function() {
    if (hvac !== 'cool' || !isOn) return '';
    var eta = this._calcEta(this._activeIdx, setTempC, curTempC, fanMode);
    if (!eta) return '';
    var prefix = eta.mode === 'estimated' ? '⏱~ ' : '⏱ ';
    var etaTxt = tr.etaText(prefix, setTempDisp, degSym, eta.eta);
      ;
    var tipTxt = eta.mode === 'estimated' ? 'title="' + tr.etaTip + '"' : '';
    return '<div class="eta-bar" id="live-eta" ' + tipTxt + '>' + etaTxt + '</div>';
  }).call(this)

+ (modeBtns ? '<div class="mode-dock-wrap" id="mode-dock">' + modeBtns + '</div>' : '')

+ (function(){
    var roomEntCfgFS = (cfg.entities && cfg.entities[self._activeIdx]) || {};
    var isCentralAC = roomEntCfgFS.is_central_ac;
    var dampersFS = roomEntCfgFS.dampers || [];
    var validDampers = dampersFS.filter(function(d){ return d && d.entity_id; });

    // ── Fan + Swing row (always shown, central AC or not) ────────────
    if (cfg.show_fan === false && cfg.show_swing === false) {
      // If both are off, only the damper is rendered (when there is one)
    }
    var fsRow = '';
    if (cfg.show_fan !== false || cfg.show_swing !== false) {
      // Count the panels first so the columns are equal. Hard-coding 3fr/2fr/2fr
      // made the fan panel wider than the other two and left the row lopsided,
      // and it was wrong again whenever hswing was absent.
      var fsCols = (cfg.show_fan !== false ? 1 : 0)
                 + (cfg.show_swing !== false ? 1 : 0)
                 + (cfg.show_swing !== false && hswingBtn ? 1 : 0);
      fsRow += '<div class="fan-swing-row" style="grid-template-columns:repeat(' + fsCols + ',1fr)">';
      if (cfg.show_fan !== false) {
        fsRow += '<div class="fan-card">'
          + '<div class="fc-head"><span class="fc-label">' + tr.fanLabel + '</span></div>'
          + '<button class="fan-tap" id="btn-fan-cycle">'
          + '  <span class="fan-ico">' + fanIconSvg + '</span>'
          + '  <div class="fan-bars">' + fanBarHtml + '</div>'
          + '  ' + acValueLine(acFanLabel(tr, fanMode), tr.fanLabel, 'fc-val')
          + '</button>'
          + '</div>';
      }
      if (cfg.show_swing !== false) {
        fsRow += '<div class="swing-card">'
          + '<div class="fc-head"><span class="fc-label">' + tr.swingLabel + '</span></div>'
          + swingBtn
          + '</div>';
        if (hswingBtn) {
          fsRow += '<div class="swing-card">'
            + '<div class="fc-head"><span class="fc-label">' + (tr.hswingLabel || 'Left-right') + '</span></div>'
            + hswingBtn
            + '</div>';
        }
      }
      fsRow += '</div>';
    }

    // ── Quick switch row (per room, auto-labelled) ──────────────────────
    var qsRow = '';
    if (cfg.show_quick_switches !== false) {
      var qsList = acQuickSwitchesFor(tr, roomEntCfgFS, cfg.language);
      if (qsList.length) {
        qsRow = '<div class="qs-row">';
        for (var _qi = 0; _qi < qsList.length; _qi++) {
          var _q = qsList[_qi];
          var _qs = self._hass && self._hass.states && self._hass.states[_q.entity_id];
          var _qSt = _qs ? _qs.state : null;
          var _qOk = _qSt === 'on' || _qSt === 'off';
          var _qOn = _qSt === 'on';
          qsRow += '<button class="qs-btn' + (_qOn ? ' qs-on' : '') + (_qOk ? '' : ' qs-off') + '"'
            + ' data-qs-idx="' + _qi + '"' + (_qOk ? '' : ' disabled')
            + ' title="' + escHtml(_q.label) + ' · ' + (_qOk ? (_qOn ? tr.qsOn : tr.qsOff) : '—') + '">'
            + '<span class="qs-ico">' + self._mdiIcon(_q.icon, 15, _qOn ? '#ffffff' : 'rgba(255,255,255,0.72)') + '</span>'
            + '<span class="qs-lbl">' + escHtml(_q.label) + '</span>'
            + '</button>';
        }
        qsRow += '</div>';
      }
    }

    // ── Damper row: shown only when is_central_ac=true AND at least one cover.* exists ─
    var damperRow = '';
    if (isCentralAC && validDampers.length > 0) {
      var openCount = 0; var totalPct = 0;
      validDampers.forEach(function(d) {
        var dst = self._hass && self._hass.states && self._hass.states[d.entity_id];
        var pos = dst ? Math.round(parseFloat(dst.attributes && dst.attributes.current_position) || 0) : 0;
        if (pos > 0) openCount++;
        totalPct += pos;
      });
      var avgPct = validDampers.length ? Math.round(totalPct / validDampers.length) : 0;
      var summaryColor = openCount === 0 ? 'rgba(255,255,255,0.4)' : openCount < validDampers.length ? '#34d399' : '#00d4ff';
      var summaryTxt = openCount + '/' + validDampers.length
        + tr.damperSummaryOpen + avgPct + '%';
      damperRow = '<div style="width:100%;margin-top:8px;">'
        + '  <button class="damper-ctrl-btn" id="btn-damper-ctrl" style="padding:8px 14px;">'
        + '    <span class="damper-ctrl-ico" style="font-size:18px;">🌀</span>'
        + '    <span class="fc-label" style="font-size:10px;letter-spacing:0.8px;white-space:nowrap;">' + (tr.damperLabel || 'Airflow') + '</span>'
        + '    <div class="damper-ctrl-info" style="display:flex;align-items:center;gap:8px;">'
        + '      <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.6px;text-transform:uppercase;white-space:nowrap;">' + validDampers.length + (tr.damperCountUnit || ' dampers') + '</span>'
        + '      <span style="font-size:12px;font-weight:700;color:' + summaryColor + ';white-space:nowrap;">' + summaryTxt + '</span>'
        + '    </div>'
        + '    <span class="damper-ctrl-arrow">&#8250;</span>'
        + '  </button>'
        + '</div>';
    }

    // Label the two rows. They sit directly on top of each other and both
    // render as pills, which made them read as one feature.
    var grouped = '';
    if (qsRow || damperRow) {
      grouped = '<div class="switch-group">'
        + (qsRow ? '<div class="group-lbl">' + tr.groupQuickSwitches + '</div>' + qsRow : '')
        + damperRow
        + '</div>';
    }
    return fsRow + grouped;
  }).call(this)


+ (!isLite && this._config.show_preset_bar !== false && chipSpecs.length ? (
  '<div class="switch-group">'
+ '  <div class="group-lbl">' + tr.groupPresets + '</div>'
+ '  <div class="chips">'
+ chipSpecs.map(function(c, i) {
        // The cycling palette is .chip--g / .chip--a / .chip--b. This used to emit
    // .chip--0 / .chip--1 / .chip--2, which match no rule at all.
    var CHIP_TONE = ['g', 'a', 'b'];
    return '<button class="chip chip--' + (CHIP_TONE[i % 3]) + (c.on ? ' chip--on' : '') + '" data-chip-idx="' + i + '">'
         + escHtml(c.label) + '</button>';
  }).join('')
+ '  </div>'
+ '</div>'
) : '')

+ (isLite ? '' : (
  '<div class="bottom-row">'
+ '<button class="power-row" id="btn-power">'
+ '  <div class="pw-btn ' + pwClass + '" style="' + pwStyle + '">&#9211;</div>'
+ '  <div style="flex:1;min-width:0">'
+ '    <div class="pw-sub pw-sub--big">' + pwSub + '</div>'
+ '  </div>'
+ '  <span class="pw-arrow">&#8250;</span>'
+ '</button>'
+ (cfg.show_timer !== false ? (
  '<button class="timer-btn' + (this._timers[this._activeIdx] ? ' timer-btn--active' : '') + '" id="btn-timer-left">'
+ '  <span class="timer-ico">&#9200;</span>'
+ '  <span class="timer-lbl">' + tr.timerBtn + '</span>'
+ '  <span class="timer-cd" id="timer-cd">' + (this._timers[this._activeIdx] ? this._fmtRemain(this._activeIdx) : '') + '</span>'
+ '</button>'
) : '')
+ '</div>'
))

+ '</div>'  // end .left

+ '<div class="right' + (isLite ? ' right--lite' : '') + '">'

+ (isLite ? '' : (
  '<div class="room-image">'
+ '  <img id="room-photo" class="room-img-el" src="' + escUrl(room.image || ROOM_IMAGES[this._activeIdx] || ROOM_IMAGES[0]) + '" alt="room">'
+ '  <div class="ac-overlay">'
+ '    <span class="ac-led ' + (isOn ? 'led-on' : 'led-off') + '"></span>'
+ '    <span class="ac-overlay-txt">' + (isOn ? tr.overlayOn : tr.overlayOff) + '</span>'
+ modeChip
+ '  </div>'
+ '  <div class="img-temp-badge" style="color:' + acTempColor(curTempC) + ';text-shadow:0 0 18px ' + acTempColor(curTempC) + ',0 0 40px ' + acTempColor(curTempC) + ',0 2px 20px rgba(0,0,0,0.7)">' + curTempDisp + '<span>' + degSym + '</span>'
+ (roomHumidityRaw > 0 ? '<span style="font-family:\'Sora\',sans-serif;font-size:13px;font-weight:500;opacity:0.75;margin-left:6px;vertical-align:middle;">💧' + Math.round(roomHumidityRaw) + '%</span>' : '')
+ '</div>'
+ '  <div class="img-room-name">' + escHtml(room.label) + '</div>'
+ '</div>'
))

+ (cfg.show_status !== false ? (
  '<div class="status-block">'
+ '  <div class="status-header">'
+ '    <div>'
+ '      <div class="st-title">' + tr.statusLabel + '</div>'
+ '      <div class="' + (isUnavailable ? 'st-offline' : (isOn ? 'st-on' : 'st-off')) + '">' + (isUnavailable ? tr.badgeOffline : (isOn ? tr.statusOn : tr.statusOff)) + '</div>'
+ '      <div class="st-sub">' + (isUnavailable ? tr.offlineWait : (isOn ? tr.airGood : tr.pressOn)) + '</div>'
+ '    </div>'
+ (pmRingHtml ? '    ' + pmRingHtml : '')
+ '  </div>'
+ (sensChipsHtml ? '  ' + sensChipsHtml : '')
+ '</div>'
) : '')

+ '<div class="room-tabs"><div class="rt-header">' + tr.selectRoom + '</div><div class="room-tabs-inner' + (ROOMS.length >= 5 ? ' scrollable' : '') + '">' + roomTabs + '</div></div>'

+ (isLite ? (
  '<div class="lite-bottom">'
+ '<button class="power-row power-row--lite" id="btn-power-lite">'
+ '  <div class="pw-btn ' + pwClass + '" style="' + pwStyle + '">&#9211;</div>'
+ '  <div style="flex:1;min-width:0"><div class="pw-sub pw-sub--big">' + pwSub + '</div></div>'
+ '  <span class="pw-arrow">&#8250;</span>'
+ '</button>'
+ '<div class="lite-bottom-row">'
+ (cfg.show_all_off !== false ? (
  '<button class="lite-small-btn lite-small-btn--alloff" id="btn-all-off-lite">'
+ '  <span class="lsb-ico">&#9211;</span>'
+ '  <span class="lsb-lbl">' + tr.allOff + '</span>'
+ '</button>'
) : '')
+ (cfg.show_timer !== false ? (
  '<button class="lite-small-btn' + (this._timers[this._activeIdx] ? ' lite-small-btn--timer-active' : '') + '" id="btn-timer">'
+ '  <span class="lsb-ico">&#9200;</span>'
+ '  <span class="lsb-lbl">' + tr.timerBtn + '</span>'
+ '  <span class="lsb-cd" id="timer-cd">' + (this._timers[this._activeIdx] ? this._fmtRemain(this._activeIdx) : '') + '</span>'
+ '</button>'
) : '')
+ '</div>'
+ '</div>'
) : (
  (cfg.show_all_off !== false ? (
  '<button class="all-off-btn" id="btn-all-off">'
+ '  <div class="all-off-ico">&#9211;</div>'
+ '  <div class="all-off-info">'
+ '    <div class="all-off-title">' + tr.allOff + '</div>'
+ '    <div class="all-off-sub">' + tr.allOffSub + '</div>'
+ '  </div>'
+ '  <div class="all-off-arr">&#8250;</div>'
+ '</button>'
  ) : '')
))

+ '</div>'  // end .right
+ '</div>'; // end .card

    // ── FIX: only update the content, never touch the injected <style> and <link>
    var container = this.shadowRoot.getElementById('ac-card-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ac-card-root';
      this.shadowRoot.appendChild(container);
    }
    container.innerHTML = '<div class="card-scale-wrap" id="ac-scale-wrap">' + html + '</div>';

    this._initialized = true;
    this._bind();
    this._startClock();
    if (this._applyScale) { var _asSelf = this; requestAnimationFrame(function(){ _asSelf._applyScale(); }); }

    // Start / stop the cool trail animation
    this._updateCoolAnim();
    // Start / stop the fan wind animation
    this._updateFanAnim();
    // Start / stop the heat flame animation
    this._updateHeatAnim();
    // Start / stop the dry mist animation
    this._updateDryAnim();
  }

  _updateCoolAnim() {
    var room = ROOMS[this._activeIdx];
    var hvac = room && this._hass && this._hass.states[room.id]
      ? (this._hass.states[room.id].attributes.hvac_mode || this._hass.states[room.id].state)
      : null;
    if (hvac === 'cool') {
      // Only start when not already running — do NOT restart on card re-render
      if (!this._coolAnimRunning) this._startCoolTrailAnim();
      // If it is already running, leave it alone
    } else {
      this._stopCoolTrailAnim();
    }
  }

  _bind() {
    var self = this;
    var r = this.shadowRoot;
    // Both are locals of the render methods, not of the bind method, and
    // both were used here anyway: `cfg` in the Lite power-on handler, `tr`
    // nowhere. Declaring them is cheaper than rewriting call sites and keeps
    // the whole bind block reading config through one name.
    var cfg = self._config || {};
    var tr  = AC_TRANSLATIONS[(cfg.language) || 'en'] || AC_TRANSLATIONS.en;

    function onTap(el, fn) {
      if (!el) return;
      var tapped = false;
      el.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        tapped = true;
        fn(e);
      }, { passive: false });
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        if (tapped) { tapped = false; return; }
        fn(e);
      });
    }

    function onTapAll(els, fn) {
      els.forEach(function(b) { onTap(b, function(e) { fn(b, e); }); });
    }

    onTap(r.getElementById('btn-temp-up'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = parseFloat(self._a(id,'temperature') || 24);
      var cfg2 = self._config || {};
      var tU = cfg2.temp_unit || 'C';
      var hU = cur > 50 ? 'F' : 'C';
      var next = acTempStep(cur, 1, tU, hU);
      self._call('climate','set_temperature',{entity_id:id, temperature: Math.min(acMaxTemp(hU), next)});
    });

    onTap(r.getElementById('btn-temp-down'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = parseFloat(self._a(id,'temperature') || 24);
      var cfg2 = self._config || {};
      var tU = cfg2.temp_unit || 'C';
      var hU = cur > 50 ? 'F' : 'C';
      var next = acTempStep(cur, -1, tU, hU);
      self._call('climate','set_temperature',{entity_id:id, temperature: Math.max(acMinTemp(hU), next)});
    });

    // ── Haptic drag on outer dial ring (set-temp) ──────────────────────────────
    (function() {
      if (self._config.dial_invert === true) return; // only when setTemp is on outer ring
      var svg = r.querySelector('#dial-wrap-main svg');
      if (!svg) return;
      var cx = 110, cy = 110;
      var _dragging = false;
      var _lastTemp = null;
      var _commitTimer = null;

      function angleToTemp(angle) {
        // Arc from -140° to +140° maps to 16°C–32°C
        var clamped = Math.max(-140, Math.min(140, angle));
        return 16 + (clamped + 140) / 280 * 16;
      }

      function getAngle(clientX, clientY) {
        var rect = svg.getBoundingClientRect();
        var scaleX = 220 / rect.width;
        var scaleY = 220 / rect.height;
        var lx = (clientX - rect.left) * scaleX - cx;
        var ly = (clientY - rect.top)  * scaleY - cy;
        var angle = Math.atan2(ly, lx) * 180 / Math.PI + 90;
        if (angle >  180) angle -= 360;
        if (angle < -180) angle += 360;
        return angle;
      }

      function getRadius(clientX, clientY) {
        var rect = svg.getBoundingClientRect();
        var scaleX = 220 / rect.width;
        var scaleY = 220 / rect.height;
        var lx = (clientX - rect.left) * scaleX - cx;
        var ly = (clientY - rect.top)  * scaleY - cy;
        return Math.sqrt(lx * lx + ly * ly);
      }

      function applyTemp(angle) {
        var id = ROOMS[self._activeIdx].id;
        var cfg2 = self._config || {};
        var tU = cfg2.temp_unit || 'C';
        var hU = parseFloat(self._a(id, 'temperature') || 24) > 50 ? 'F' : 'C';
        var tempC = angleToTemp(angle);
        // Convert to HA unit if needed
        var tempHA = hU === 'F' ? (tempC * 9/5 + 32) : tempC;
        tempHA = Math.round(tempHA * 2) / 2; // round to 0.5
        tempHA = Math.max(acMinTemp(hU), Math.min(acMaxTemp(hU), tempHA));
        if (_lastTemp !== tempHA) {
          _lastTemp = tempHA;
          // Update display immediately for haptic feel
          var liveSet = r.getElementById('live-set-temp');
          if (liveSet) {
            var dispVal = hU === 'F' && tU === 'C'
              ? (Math.round((tempHA - 32) * 5/9 * 2) / 2).toFixed(1)
              : (tU === 'F' && hU === 'C' ? Math.round(tempHA * 9/5 + 32).toString() : tempHA.toFixed(1));
            var dSym = tU === 'F' ? '°F' : '°C';
            liveSet.innerHTML = dispVal + '<span style="font-size:0.55em;vertical-align:super;">' + dSym + '</span>';
          }
          // Vibrate if available (haptic feedback)
          if (navigator.vibrate) navigator.vibrate(8);
          // Debounce HA service call
          clearTimeout(_commitTimer);
          _commitTimer = setTimeout(function() {
            self._call('climate','set_temperature',{entity_id:id, temperature: tempHA});
          }, 300);
        }
      }

      // Arc path helper — same convention as this._arc(): angle 0 = 12 o'clock, clockwise
      function _arcPath(cx, cy, r, a1, a2) {
        var rad = function(d) { return (d - 90) * Math.PI / 180; };
        var x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
        var x2 = cx + r * Math.cos(rad(a2)), y2 = cy + r * Math.sin(rad(a2));
        var lg = (a2 - a1 > 180) ? 1 : 0;
        return 'M' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + lg + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2);
      }

      function updateDotPosition(angle) {
        var clamped = Math.max(-140, Math.min(140, angle));
        var arcEnd2 = clamped; // same value, explicit naming

        // -- Move outer dot circles to new position on r=88 ring --
        var dotRad = (arcEnd2 - 90) * Math.PI / 180;
        var nx = (110 + 88 * Math.cos(dotRad)).toFixed(1);
        var ny = (110 + 88 * Math.sin(dotRad)).toFixed(1);
        svg.querySelectorAll('circle').forEach(function(c) {
          if (c.id === 'dial-drag-zone') return;
          var cx2 = parseFloat(c.getAttribute('cx'));
          var cy2 = parseFloat(c.getAttribute('cy'));
          var dist = Math.sqrt((cx2-110)*(cx2-110) + (cy2-110)*(cy2-110));
          if (dist > 82) { // outer ring r=88 only — skip inner ring r=76
            c.setAttribute('cx', nx);
            c.setAttribute('cy', ny);
          }
        });

        // -- Update outer arc fill path using same _arcPath convention --
        var pct2 = (clamped + 140) / 280;
        if (pct2 > 0.02) {
          svg.querySelectorAll('path[fill="none"]').forEach(function(p) {
            var sw = p.getAttribute('stroke-width');
            if (sw !== '10' && sw !== '12') return;
            var st = p.getAttribute('stroke') || '';
            if (st.startsWith('rgba(255,255,255')) return; // skip track paths
            p.setAttribute('d', _arcPath(110, 110, 88, -140, arcEnd2));
          });
        }
      }

      svg.addEventListener('pointerdown', function(e) {
        var r2 = getRadius(e.clientX, e.clientY);
        if (r2 < 70 || r2 > 108) return; // only outer ring zone
        _dragging = true;
        self._dialDragging = true; // seen by the hass setter's re-render guard
        svg.style.cursor = 'grabbing';
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        var ang = getAngle(e.clientX, e.clientY);
        applyTemp(ang);
        updateDotPosition(ang);
      });
      svg.addEventListener('pointermove', function(e) {
        if (!_dragging) return;
        e.preventDefault();
        var ang = getAngle(e.clientX, e.clientY);
        applyTemp(ang);
        updateDotPosition(ang);
      });
      svg.addEventListener('pointerup', function(e) {
        if (!_dragging) return;
        _dragging = false;
        self._dialDragging = false;
        svg.style.cursor = '';
        // Commit final value
        var id = ROOMS[self._activeIdx].id;
        var cfg2 = self._config || {};
        var hU = parseFloat(self._a(id, 'temperature') || 24) > 50 ? 'F' : 'C';
        if (_lastTemp !== null) {
          clearTimeout(_commitTimer);
          self._call('climate','set_temperature',{entity_id:id, temperature: _lastTemp});
        }
      });
      svg.addEventListener('pointercancel', function() {
        _dragging = false;
        self._dialDragging = false;
        svg.style.cursor = '';
      });
    })();

    onTapAll(r.querySelectorAll('[data-hvac]'), function(b) {
      var _hvacId = ROOMS[self._activeIdx].id;
      var _newMode = b.dataset.hvac;
      // If a mode other than off is chosen → remember it as the "last mode" for the next power-on
      if (_newMode && _newMode !== 'off') self._hvacModeSave(_hvacId, _newMode);
      self._call('climate','set_hvac_mode',{entity_id:_hvacId, hvac_mode:_newMode});
    });

    // ── macOS Dock effect for mode buttons ──────────────────────────────────
    (function() {
      var dock = r.getElementById('mode-dock');
      if (!dock) return;
      var btns = Array.prototype.slice.call(dock.querySelectorAll('.mode-btn'));
      if (btns.length < 2) return;

      function applyDock(hoveredIdx) {
        dock.classList.add('dock-active');
        btns.forEach(function(btn, i) {
          btn.classList.remove('dock-hovered');
          // Unconditional clear FIRST. This used to happen only for the
          // button being selected, so every button the pointer had already
          // crossed kept its lift for as long as the pointer stayed in the
          // row -- resetDock only runs on the dock's mouseleave. Sliding the
          // pointer across all five left all five lifted, which is the very
          // symptom this change was meant to remove.
          btn.style.transform = '';
          // Only the hovered button moves, and only slightly. The lift used
          // to be scale(1.1) translateY(-4px); on a row that was also dimming
          // all five buttons at once that read as a press rather than a hover.
          if (i === hoveredIdx) {
            btn.classList.add('dock-hovered');
            btn.style.transform = 'scale(1.05) translateY(-2px)';
          }
        });
      }

      function resetDock() {
        dock.classList.remove('dock-active');
        btns.forEach(function(btn) {
          btn.classList.remove('dock-hovered');
          btn.style.transform = '';
        });
      }

      btns.forEach(function(btn, i) {
        btn.addEventListener('mouseenter', function() { applyDock(i); });
        btn.addEventListener('touchstart', function() { applyDock(i); }, { passive: true });
      });
      dock.addEventListener('mouseleave', resetDock);
      dock.addEventListener('touchend', function() { setTimeout(resetDock, 350); }, { passive: true });
    })();

    onTapAll(r.querySelectorAll('[data-fan]'), function(b) {
      self._call('climate','set_fan_mode',{entity_id:ROOMS[self._activeIdx].id, fan_mode:b.dataset.fan});
    });
    // ── Damper All-in-One Popup (Central AC) ──────────────────────────────────
    (function() {
      var ctrlBtn = r.getElementById('btn-damper-ctrl');
      if (!ctrlBtn) return;

      var roomEntCfgP = (self._config && self._config.entities && self._config.entities[self._activeIdx]) || {};
      var dampersAll  = (roomEntCfgP.dampers || []).filter(function(d){ return d && d.entity_id; });
      if (!dampersAll.length) return;

      var trP = AC_TRANSLATIONS[(self._config && self._config.language) || 'en'] || AC_TRANSLATIONS.zh;

      function openDamperAllPopup() {
        // Remove the old popup
        var oldOv = self.shadowRoot.getElementById('damper-all-ov');
        if (oldOv) { oldOv.remove(); return; }

        // Read the current position of each damper
        var pending = dampersAll.map(function(d) {
          var dst = self._hass && self._hass.states && self._hass.states[d.entity_id];
          return dst ? Math.round(parseFloat(dst.attributes && dst.attributes.current_position) || 0) : 0;
        });

        // Build popup HTML
        var itemsHtml = dampersAll.map(function(d, di) {
          var pos = pending[di];
          var col = pos < 20 ? 'rgba(255,255,255,0.4)' : pos < 60 ? '#34d399' : '#00d4ff';
          var trackBg = 'linear-gradient(to right,' + col + ' ' + pos + '%,rgba(255,255,255,0.15) ' + pos + '%)';
          return '<div class="damper-all-item" id="dmp-item-' + di + '">'
            + '  <div class="damper-all-item-header">'
            + '    <div class="damper-all-item-name">🌀 ' + escHtml(d.name || d.entity_id) + '</div>'
            + '    <div class="damper-all-item-pct" id="dmp-pct-' + di + '" style="color:' + col + '">' + pos + '%</div>'
            + '  </div>'
            + '  <input class="damper-all-slider" id="dmp-sl-' + di + '" type="range" min="0" max="100" step="5"'
            + '    value="' + pos + '" style="background:' + trackBg + '">'
            + '  <div class="damper-all-quick">'
            + '    <button class="damper-all-quick-btn' + (pos===0?' active':'') + '" data-di="' + di + '" data-val="0">' + (trP.damperQuickClose || '✕ Close') + '</button>'
            + '    <button class="damper-all-quick-btn' + (pos===25?' active':'') + '" data-di="' + di + '" data-val="25">25%</button>'
            + '    <button class="damper-all-quick-btn' + (pos===50?' active':'') + '" data-di="' + di + '" data-val="50">50%</button>'
            + '    <button class="damper-all-quick-btn' + (pos===75?' active':'') + '" data-di="' + di + '" data-val="75">75%</button>'
            + '    <button class="damper-all-quick-btn' + (pos===100?' active':'') + '" data-di="' + di + '" data-val="100">' + (trP.damperQuickOpen || '✓ Open') + '</button>'
            + '  </div>'
            + '</div>';
        }).join('');

        var ov = document.createElement('div');
        ov.id = 'damper-all-ov';
        ov.className = 'damper-all-popup-overlay';
        ov.innerHTML =
          '<div class="damper-all-popup" id="damper-all-inner">'
        + '  <div class="damper-all-header">'
        + '    <div class="damper-all-title">🌀 ' + (trP.damperLabel || 'AIRFLOW') + ' · ' + dampersAll.length + ' Cover</div>'
        + '    <button class="damper-all-close" id="dmp-close-top">✕</button>'
        + '  </div>'
        + '  <div id="dmp-items-wrap">' + itemsHtml + '</div>'
        + '  <div class="damper-all-footer">'
        + '    <button class="damper-all-btn damper-all-btn--close" id="dmp-btn-cancel">' + (trP.cancel || 'Cancel') + '</button>'
        + '    <button class="damper-all-btn damper-all-btn--apply" id="dmp-btn-apply">✓ Apply</button>'
        + '  </div>'
        + '</div>';

        self.shadowRoot.appendChild(ov);

        // ── Helpers ─────────────────────────────────────────────────────────
        function getColor(p) {
          return p < 20 ? 'rgba(255,255,255,0.4)' : p < 60 ? '#34d399' : '#00d4ff';
        }
        function updateSliderTrack(sl, p) {
          var c = getColor(p);
          sl.style.background = 'linear-gradient(to right,' + c + ' ' + p + '%,rgba(255,255,255,0.15) ' + p + '%)';
        }
        function setDamperVal(di, val) {
          pending[di] = val;
          var pctEl = ov.querySelector('#dmp-pct-' + di);
          var slEl  = ov.querySelector('#dmp-sl-'  + di);
          if (pctEl) { pctEl.textContent = val + '%'; pctEl.style.color = getColor(val); }
          if (slEl)  { slEl.value = val; updateSliderTrack(slEl, val); }
          // Update quick buttons active state
          ov.querySelectorAll('[data-di="' + di + '"]').forEach(function(qb) {
            var qv = parseInt(qb.dataset.val);
            if (!isNaN(qv)) qb.classList.toggle('active', qv === val);
          });
        }

        // ── Bind sliders ────────────────────────────────────────────────────
        dampersAll.forEach(function(d, di) {
          var sl = ov.querySelector('#dmp-sl-' + di);
          if (!sl) return;
          sl.addEventListener('input', function() {
            setDamperVal(di, parseInt(sl.value));
          });
        });

        // ── Bind quick buttons ───────────────────────────────────────────────
        ov.querySelectorAll('.damper-all-quick-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var di  = parseInt(btn.dataset.di);
            var val = parseInt(btn.dataset.val);
            if (!isNaN(di) && !isNaN(val)) setDamperVal(di, val);
          });
        });

        // ── Close / Apply ────────────────────────────────────────────────────
        function closePopup() { ov.remove(); }

        function applyAll() {
          dampersAll.forEach(function(d, di) {
            self._call('cover', 'set_cover_position', {
              entity_id: d.entity_id,
              position: pending[di]
            });
          });
          ov.remove();
        }

        ov.querySelector('#dmp-btn-cancel').addEventListener('click', closePopup);
        ov.querySelector('#dmp-close-top').addEventListener('click', closePopup);
        ov.querySelector('#dmp-btn-apply').addEventListener('click', applyAll);

        // Click backdrop
        ov.addEventListener('click', function(e) {
          if (e.target === ov) closePopup();
        });
      }

      ctrlBtn.addEventListener('click', openDamperAllPopup);
      ctrlBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        openDamperAllPopup();
      }, { passive: false });
    })();
    // ── End damper popup ─────────────────────────────────────────────────────

    onTap(r.getElementById('btn-power'), function() {
      var id = ROOMS[self._activeIdx].id;
      var curState = self._s(id);
      // Do nothing while the entity is disconnected
      if (curState === 'unavailable' || curState === 'unknown') return;
      if (curState !== 'off') {
        // Store the current mode in localStorage before turning off
        self._hvacModeSave(id, curState);
        self._call('climate','set_hvac_mode',{entity_id:id, hvac_mode:'off'});
      } else {
        // Power on: prefer climate.turn_on so the system mode is respected (Mitsubishi City Multi, etc.)
        self._turnOn(id);
      }
    });

    onTap(r.getElementById('btn-gear'), function() {
      var entityId = ROOMS[self._activeIdx].id;
      self.dispatchEvent(new CustomEvent('hass-more-info', {
        bubbles: true, composed: true,
        detail: { entityId: entityId }
      }));
    });
    // View mode switcher (full/lite header)
    onTap(r.getElementById('hdr-vs-full'), function() {
      self._config = Object.assign({}, self._config, { view_mode: 'full' });
      self._renderFull();
    });
    onTap(r.getElementById('hdr-vs-lite'), function() {
      self._config = Object.assign({}, self._config, { view_mode: 'lite' });
      self._renderFull();
    });
    onTap(r.getElementById('hdr-vs-superlite'), function() {
      self._config = Object.assign({}, self._config, { view_mode: 'super_lite' });
      self._renderFull();
    });

    // One handler for every chip, resolved from the same spec the render used.
    Array.prototype.slice.call(r.querySelectorAll('[data-chip-idx]')).forEach(function(btn) {
      onTap(btn, function() {
        acChipCall(self, acChipSpec(self._config, AC_TRANSLATIONS[(self._config && self._config.language) || 'en'] || AC_TRANSLATIONS.en,
                                    ROOMS[self._activeIdx], self._hass)[parseInt(btn.dataset.chipIdx, 10)]);
      });
    });
    onTap(r.getElementById('btn-eco'), function() {
      acChipCall(self, acChipSpec(self._config,
        AC_TRANSLATIONS[(self._config && self._config.language) || 'en'] || AC_TRANSLATIONS.en,
        ROOMS[self._activeIdx], self._hass)[0]);
    });

    onTap(r.getElementById('btn-fan-cycle'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = self._a(id,'fan_mode') || 'auto';
      var supported = self._a(id,'fan_modes');
      var levels = (Array.isArray(supported) && supported.length > 0) ? supported : FAN_LEVELS;
      var idx = levels.indexOf(cur);
      var next = levels[(idx + 1) % levels.length];
      self._call('climate','set_fan_mode',{entity_id:id, fan_mode:next});
    });

    // Quick switches — a disabled button must not fire a service call
    // (the card's _bind() names the shadow root `r`; `sr` only exists in the editor)
    r.querySelectorAll('[data-qs-idx]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.disabled || btn.hasAttribute('disabled')) return;
        var qi = parseInt(btn.dataset.qsIdx, 10);
        var roomCfg = (self._config.entities && self._config.entities[self._activeIdx]) || {};
        var q = acQuickSwitchesFor(tr, roomCfg, self._config.language)[qi];
        if (!q) return;
        self._call('switch', 'toggle', { entity_id: q.entity_id });
      });
    });

    onTap(r.getElementById('btn-hswing'), function() {
      var id = ROOMS[self._activeIdx].id;
      var supported = self._a(id, 'swing_horizontal_modes');
      if (!Array.isArray(supported) || !supported.length) return;
      var cur = self._a(id,'swing_horizontal_mode') || supported[0];
      var idx = supported.indexOf(cur);
      // unsupported current value (idx = -1) -> restart from the beginning
      var next = idx >= 0 ? supported[(idx + 1) % supported.length] : supported[0];
      self._call('climate','set_swing_horizontal_mode',{entity_id:id, swing_horizontal_mode:next});
    });

    onTap(r.getElementById('btn-swing'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = self._a(id,'swing_mode') || 'off';
      // Only use the entity's real swing_modes — never show or cycle unsupported ones
      var supported = self._a(id,'swing_modes');
      var levels = (Array.isArray(supported) && supported.length > 0) ? supported : SWING_LEVELS;
      var idx = levels.indexOf(cur);
      // If the current mode is not in the supported list (idx = -1) → go back to the start
      // instead of getting stuck on an invalid mode
      var next = idx >= 0 ? levels[(idx + 1) % levels.length] : levels[0];
      self._call('climate','set_swing_mode',{entity_id:id, swing_mode:next});
    });

    // btn-power-lite (lite mode) — same action as btn-power
    onTap(r.getElementById('btn-power-lite'), function() {
      var id = ROOMS[self._activeIdx].id;
      var curState2 = self._s(id);
      // Do nothing while the entity is disconnected
      if (curState2 === 'unavailable' || curState2 === 'unknown') return;
      if (curState2 !== 'off') {
        self._hvacModeSave(id, curState2);
        self._call('climate','set_hvac_mode',{entity_id:id, hvac_mode:'off'});
      } else {
        // Central AC check: block power-on when every damper is closed
        var roomCfgLite = (cfg.entities && cfg.entities[self._activeIdx]) || {};
        if (roomCfgLite.is_central_ac) {
          var dmpsLite = roomCfgLite.dampers || [];
          var anyOpenLite = dmpsLite.some(function(d) {
            if (!d || !d.entity_id) return false;
            var st = self._hass && self._hass.states && self._hass.states[d.entity_id];
            return st ? ((parseFloat(st.attributes && st.attributes.current_position) || 0) > 0) : false;
          });
          if (!anyOpenLite && dmpsLite.length > 0) return;
        }
        self._turnOn(id);
      }
    });

    // all-off lite (same logic, different element id)
    var allOffLiteHandler = function() {
      var sr2 = self.shadowRoot;
      var allOffBtn = r.getElementById('btn-all-off-lite') || r.getElementById('btn-all-off');
      var oldP = sr2.getElementById('confirm-popup-el');
      if (oldP) { oldP.remove(); return; }
      var cpop = document.createElement('div');
      cpop.id = 'confirm-popup-el';
      cpop.className = 'confirm-popup';
      var rect2 = allOffBtn.getBoundingClientRect();
      cpop.style.bottom = (window.innerHeight - rect2.top + 10) + 'px';
      cpop.style.right  = (window.innerWidth  - rect2.right + 12) + 'px';
      var trPop = AC_TRANSLATIONS[(self._config && self._config.language) || 'en'] || AC_TRANSLATIONS.zh;
      cpop.innerHTML =
        '<div class="cp-title">' + trPop.confirmOff + '</div>'
        + '<div class="cp-sub">' + trPop.confirmSub(ROOMS.length) + '</div>'
        + '<div class="cp-acts">'
        + '<button class="cp-cancel" id="cp-cancel-btn">' + trPop.cancel + '</button>'
        + '<button class="cp-ok" id="cp-ok-btn">' + trPop.doOff + '</button>'
        + '</div>';
      sr2.appendChild(cpop);
      cpop.querySelector('#cp-cancel-btn').onclick = function(ev) { ev.stopPropagation(); cpop.remove(); };
      cpop.querySelector('#cp-ok-btn').onclick = function(ev) {
        ev.stopPropagation();
        ROOMS.forEach(function(room) {
          var rSt = self._s(room.id);
          if (rSt !== 'unavailable' && rSt !== 'unknown' && rSt !== 'off') {
            self._call('climate','set_hvac_mode',{entity_id:room.id, hvac_mode:'off'});
          }
        });
        cpop.remove();
      };
      self._confirmJustOpened = true;
      setTimeout(function() { self._confirmJustOpened = false; }, 80);
      function outsideConfirmLite(ev) {
        if (self._confirmJustOpened) return;
        var path = ev.composedPath ? ev.composedPath() : [];
        if (path.indexOf(cpop) === -1 && path.indexOf(allOffBtn) === -1) {
          cpop.remove();
          document.removeEventListener('click',    outsideConfirmLite, true);
          document.removeEventListener('touchend', outsideConfirmLite, true);
        }
      }
      document.addEventListener('click',    outsideConfirmLite, true);
      document.addEventListener('touchend', outsideConfirmLite, true);
    };
    onTap(r.getElementById('btn-all-off-lite'), allOffLiteHandler);

    onTap(r.getElementById('btn-all-off'), function() {
      var sr2 = self.shadowRoot;
      var allOffBtn = r.getElementById('btn-all-off');
      var oldP = sr2.getElementById('confirm-popup-el');
      if (oldP) { oldP.remove(); return; }
      var cpop = document.createElement('div');
      cpop.id = 'confirm-popup-el';
      cpop.className = 'confirm-popup';
      var rect2 = allOffBtn.getBoundingClientRect();
      cpop.style.bottom = (window.innerHeight - rect2.top + 10) + 'px';
      cpop.style.right  = (window.innerWidth  - rect2.right + 12) + 'px';
      var trPop = AC_TRANSLATIONS[(self._config && self._config.language) || 'en'] || AC_TRANSLATIONS.zh;
      cpop.innerHTML =
        '<div class="cp-title">' + trPop.confirmOff + '</div>'
        + '<div class="cp-sub">' + trPop.confirmSub(ROOMS.length) + '</div>'
        + '<div class="cp-acts">'
        + '<button class="cp-cancel" id="cp-cancel-btn">' + trPop.cancel + '</button>'
        + '<button class="cp-ok" id="cp-ok-btn">' + trPop.doOff + '</button>'
        + '</div>';
      sr2.appendChild(cpop);
      cpop.querySelector('#cp-cancel-btn').onclick = function(ev) { ev.stopPropagation(); cpop.remove(); };
      cpop.querySelector('#cp-ok-btn').onclick = function(ev) {
        ev.stopPropagation();
        ROOMS.forEach(function(room) {
          var rSt = self._s(room.id);
          if (rSt !== 'unavailable' && rSt !== 'unknown' && rSt !== 'off') {
            self._call('climate','set_hvac_mode',{entity_id:room.id, hvac_mode:'off'});
          }
        });
        cpop.remove();
      };
      self._confirmJustOpened = true;
      setTimeout(function() { self._confirmJustOpened = false; }, 80);
      function outsideConfirm(ev) {
        if (self._confirmJustOpened) return;
        var path = ev.composedPath ? ev.composedPath() : [];
        if (path.indexOf(cpop) === -1 && path.indexOf(allOffBtn) === -1) {
          cpop.remove();
          document.removeEventListener('click',    outsideConfirm, true);
          document.removeEventListener('touchend', outsideConfirm, true);
        }
      }
      document.addEventListener('click',    outsideConfirm, true);
      document.addEventListener('touchend', outsideConfirm, true);
    });

    onTapAll(r.querySelectorAll('[data-room]'), function(b) {
      var newIdx = parseInt(b.dataset.room);
      if (newIdx === self._activeIdx) return;
      var img = r.getElementById('room-photo');
      if (img) {
        img.classList.add('fade-out');
        setTimeout(function() { self._setActiveRoom(newIdx); self._renderFull(); }, 300);
      } else {
        self._setActiveRoom(newIdx); self._renderFull();
      }
    });

    // ── Room tooltip: injected into document.body to escape overflow:hidden ──
    // CSS inside the shadow DOM does not apply to body → use inline styles
    if (!self._acTip) {
      var tip = document.createElement('div');
      tip.id = 'ac-room-tip-' + Math.random().toString(36).slice(2);
      tip.style.cssText = [
        'position:fixed',
        'z-index:99999',
        'pointer-events:none',
        'background:rgba(6,10,28,0.96)',
        'border:1px solid rgba(255,255,255,0.18)',
        'border-radius:12px',
        'padding:8px 14px',
        'max-width:260px',
        'white-space:normal',
        'line-height:1.55',
        'font-size:11px',
        'font-weight:500',
        "font-family:'Sora',sans-serif",
        'box-shadow:0 6px 28px rgba(0,0,0,0.7)',
        'opacity:0',
        'transition:opacity 0.2s ease',
        'display:none',
        'backdrop-filter:blur(12px)',
        '-webkit-backdrop-filter:blur(12px)',
      ].join(';');
      document.body.appendChild(tip);
      self._acTip = tip;
    }
    var _acTip = self._acTip;
    // Timer id for the 5s auto-hide — kept on self so it can be cleared on re-render
    if (!self._tipAutoHideTimer) self._tipAutoHideTimer = null;
    if (!self._tipFadeTimer)     self._tipFadeTimer     = null;

    function _clearTipTimers() {
      if (self._tipAutoHideTimer) { clearTimeout(self._tipAutoHideTimer); self._tipAutoHideTimer = null; }
      if (self._tipFadeTimer)     { clearTimeout(self._tipFadeTimer);     self._tipFadeTimer     = null; }
    }

    function _hideTipNow() {
      _clearTipTimers();
      _acTip.style.opacity = '0';
      self._tipFadeTimer = setTimeout(function() { _acTip.style.display = 'none'; }, 200);
    }

    function _showRoomTip(btn) {
      var msg = btn.dataset.tip;
      if (!msg) { _hideTipNow(); return; }
      // Cancel the old timer before showing again (prevents flicker)
      _clearTipTimers();
      var color = btn.dataset.tipColor || '#fff';
      _acTip.textContent = msg;
      _acTip.style.color = color;
      _acTip.style.display = 'block';
      _acTip.style.opacity = '0';
      // Position the tooltip — prefer the right of the button, fall back to the left
      var rect = btn.getBoundingClientRect();
      var tipTop  = rect.top + rect.height / 2;
      var tipLeft = rect.right + 12;
      _acTip.style.top       = tipTop + 'px';
      _acTip.style.left      = tipLeft + 'px';
      _acTip.style.transform = 'translateY(-50%)';
      // Use a double rAF so display:block is fully painted before reading offsetWidth
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          var tw = _acTip.offsetWidth || 220;
          if (tipLeft + tw > window.innerWidth - 8) {
            _acTip.style.left = (rect.left - tw - 12) + 'px';
          }
          _acTip.style.opacity = '1';
          // Auto-hide after 5 seconds (mobile has no mouseleave)
          _clearTipTimers();
          self._tipAutoHideTimer = setTimeout(function() { _hideTipNow(); }, 5000);
        });
      });
    }

    r.querySelectorAll('[data-room]').forEach(function(btn) {
      // Desktop: normal hover behaviour
      btn.addEventListener('mouseenter', function() { _showRoomTip(btn); });
      btn.addEventListener('mouseleave', function() { _hideTipNow(); });
      // Mobile: touchstart shows the tooltip; do NOT call _hideTipNow immediately
      // The 5s timer hides it automatically — avoids a flicker race
      btn.addEventListener('touchstart', function(e) {
        // Only show the tooltip; do not touch the room-selection logic
        _showRoomTip(btn);
      }, { passive: true });
    });

    this._bindTimer();
  }

  _bindSuperLite() {
    var self = this;
    var r = this.shadowRoot;
    // openRoomPopup() used `tr`, which is a per-render local. The throw landed
    // mid-loop AFTER the transparent backdrop had already been appended to
    // document.body, so every tap stranded another full-viewport layer with
    // no close handler -- the next tap added one more.
    var cfg = self._config || {};
    var tr  = AC_TRANSLATIONS[(cfg.language) || 'en'] || AC_TRANSLATIONS.en;
    // This method runs on every Super Lite re-render and adds three document
    // listeners. The chained cleanup was only ever invoked from
    // disconnectedCallback, so the count grew as 3 x re-renders for the whole
    // life of the element. Unwind the previous chain before adding more.
    if (self._slCleanup) { self._slCleanup(); self._slCleanup = null; }

    function onTapSL(el, fn) {
      if (!el) return;
      var tapped = false;
      el.addEventListener('touchstart', function(e) { e.preventDefault(); tapped = true; fn(e); }, { passive: false });
      el.addEventListener('click', function(e) { e.stopPropagation(); if (tapped) { tapped = false; return; } fn(e); });
    }

    // ── Haptic drag on SL outer dial ring (set-temp) ──────────────────────────
    (function() {
      if (self._config.dial_invert === true) return;
      var slSvg = r.querySelector('.sl-dial-wrap svg');
      if (!slSvg) return;
      self._slDragging = false;
      var _slLastTemp = null;
      var _slCommit   = null;
      var cx = 110, cy = 110;

      function slAngleToTemp(a) { return 16 + (Math.max(-140, Math.min(140, a)) + 140) / 280 * 16; }

      function slGetAngle(clientX, clientY) {
        var rect = slSvg.getBoundingClientRect();
        var scaleX = 220 / rect.width, scaleY = 220 / rect.height;
        var lx = (clientX - rect.left) * scaleX - cx;
        var ly = (clientY - rect.top)  * scaleY - cy;
        var a  = Math.atan2(ly, lx) * 180 / Math.PI + 90;
        if (a >  180) a -= 360;
        if (a < -180) a += 360;
        return a;
      }

      function slGetRadius(clientX, clientY) {
        var rect = slSvg.getBoundingClientRect();
        var scaleX = 220 / rect.width, scaleY = 220 / rect.height;
        var lx = (clientX - rect.left) * scaleX - cx;
        var ly = (clientY - rect.top)  * scaleY - cy;
        return Math.sqrt(lx*lx + ly*ly);
      }

      function slApplyTemp(angle) {
        var id   = ROOMS[self._activeIdx].id;
        var cfg2 = self._config || {};
        var tU   = cfg2.temp_unit || 'C';
        var hU   = parseFloat(self._a(id, 'temperature') || 24) > 50 ? 'F' : 'C';
        var tempC  = slAngleToTemp(angle);
        var tempHA = hU === 'F' ? (tempC * 9/5 + 32) : tempC;
        tempHA = Math.round(tempHA * 2) / 2;
        tempHA = Math.max(acMinTemp(hU), Math.min(acMaxTemp(hU), tempHA));
        if (_slLastTemp !== tempHA) {
          _slLastTemp = tempHA;
          var liveSet = r.getElementById('live-set-temp');
          if (liveSet) {
            var dispVal = hU === 'F' && tU === 'C'
              ? (Math.round((tempHA - 32) * 5/9 * 2) / 2).toFixed(1)
              : (tU === 'F' && hU === 'C' ? Math.round(tempHA * 9/5 + 32).toString() : tempHA.toFixed(1));
            liveSet.innerHTML = dispVal + '<span style="font-size:0.55em;vertical-align:super;">' + (tU === 'F' ? '°F' : '°C') + '</span>';
          }
          if (navigator.vibrate) navigator.vibrate(8);
          clearTimeout(_slCommit);
          _slCommit = setTimeout(function() {
            self._call('climate', 'set_temperature', { entity_id: id, temperature: tempHA });
          }, 300);
        }
      }

      // Arc helper — angle 0 = 12 o'clock, clockwise (matches _arc())
      function slArcPath(cx2, cy2, rr, a1, a2) {
        var rad = function(d) { return (d - 90) * Math.PI / 180; };
        var x1 = cx2 + rr * Math.cos(rad(a1)), y1 = cy2 + rr * Math.sin(rad(a1));
        var x2 = cx2 + rr * Math.cos(rad(a2)), y2 = cy2 + rr * Math.sin(rad(a2));
        var lg = (a2 - a1 > 180) ? 1 : 0;
        return 'M' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A' + rr + ' ' + rr + ' 0 ' + lg + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2);
      }

      function slUpdateDot(angle) {
        var clamped = Math.max(-140, Math.min(140, angle));
        // Move outer dot circles only (data-ring="outer")
        var dotRad = (clamped - 90) * Math.PI / 180;
        var nx = (110 + 88 * Math.cos(dotRad)).toFixed(1);
        var ny = (110 + 88 * Math.sin(dotRad)).toFixed(1);
        slSvg.querySelectorAll('circle[data-ring="outer"]').forEach(function(c) {
          c.setAttribute('cx', nx);
          c.setAttribute('cy', ny);
        });
        // Update outer arc fill only (data-ring="outer"), never touch inner ring
        var pct2 = (clamped + 140) / 280;
        if (pct2 > 0.02) {
          slSvg.querySelectorAll('path[data-ring="outer"][fill="none"]').forEach(function(p) {
            var st = p.getAttribute('stroke') || '';
            if (st.startsWith('rgba(255,255,255')) return; // skip track (background)
            p.setAttribute('d', slArcPath(110, 110, 88, -140, clamped));
          });
        }
      }

      slSvg.addEventListener('pointerdown', function(e) {
        if (slGetRadius(e.clientX, e.clientY) < 70 || slGetRadius(e.clientX, e.clientY) > 108) return;
        self._slDragging = true;
        slSvg.style.cursor = 'grabbing';
        e.preventDefault();
        slSvg.setPointerCapture(e.pointerId);
        var ang = slGetAngle(e.clientX, e.clientY);
        slApplyTemp(ang); slUpdateDot(ang);
      });
      slSvg.addEventListener('pointermove', function(e) {
        if (!self._slDragging) return;
        e.preventDefault();
        var ang = slGetAngle(e.clientX, e.clientY);
        slApplyTemp(ang); slUpdateDot(ang);
      });
      slSvg.addEventListener('pointerup', function(e) {
        if (!self._slDragging) return;
        self._slDragging = false; slSvg.style.cursor = '';
        if (_slLastTemp !== null) {
          clearTimeout(_slCommit);
          self._call('climate', 'set_temperature', { entity_id: ROOMS[self._activeIdx].id, temperature: _slLastTemp });
        }
      });
      slSvg.addEventListener('pointercancel', function() { self._slDragging = false; slSvg.style.cursor = ''; });
    })();

    // Temp up/down
    onTapSL(r.getElementById('sl-btn-temp-up'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = parseFloat(self._a(id,'temperature') || 24);
      var cfg2 = self._config || {};
      var tU = cfg2.temp_unit || 'C';
      var hU = cur > 50 ? 'F' : 'C';
      var next = acTempStep(cur, 1, tU, hU);
      self._call('climate','set_temperature',{entity_id:id, temperature: Math.min(acMaxTemp(hU), next)});
    });
    onTapSL(r.getElementById('sl-btn-temp-down'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = parseFloat(self._a(id,'temperature') || 24);
      var cfg2 = self._config || {};
      var tU = cfg2.temp_unit || 'C';
      var hU = cur > 50 ? 'F' : 'C';
      var next = acTempStep(cur, -1, tU, hU);
      self._call('climate','set_temperature',{entity_id:id, temperature: Math.max(acMinTemp(hU), next)});
    });

    // Fan dropdown popup (Super Lite)
    var slFanPopupEl = null;
    function closeSlFanPopup() {
      if (slFanPopupEl && slFanPopupEl.parentNode) { slFanPopupEl.parentNode.removeChild(slFanPopupEl); slFanPopupEl = null; }
      var ov = document.getElementById('sl-fan-overlay-global'); if (ov) ov.parentNode.removeChild(ov);
    }
    function openSlFanPopup() {
      if (slFanPopupEl) { closeSlFanPopup(); return; }
      var lang2   = (self._config && self._config.language) || 'en';
      var tr2     = AC_TRANSLATIONS[lang2] || AC_TRANSLATIONS.zh;
      var isWave  = (self._config && self._config.popup_style) === 'wave';
      var id      = ROOMS[self._activeIdx].id;
      var curFan  = self._a(id,'fan_mode') || 'auto';
      var rawModes = self._a(id,'fan_modes');
      var modes   = (Array.isArray(rawModes) && rawModes.length > 0) ? rawModes : FAN_LEVELS;
      var fanLbls = tr2.fans || ['Auto','Min','Low','Low-Mid','Medium','High-Mid','High','Max','Low/Auto','High/Auto','Quiet'];

      var overlay = document.createElement('div');
      overlay.id = 'sl-fan-overlay-global';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:transparent';
      document.body.appendChild(overlay);

      var pop = document.createElement('div');
      pop.style.cssText = [
        'position:fixed','z-index:9999',
        'background:rgba(8,20,48,0.55)',
        'border:1px solid rgba(255,255,255,0.20)',
        'border-top:1px solid rgba(255,255,255,0.35)',
        'border-radius:22px',
        'backdrop-filter:blur(48px) saturate(2) brightness(1.1)',
        '-webkit-backdrop-filter:blur(48px) saturate(2) brightness(1.1)',
        'box-shadow:0 2px 0 rgba(255,255,255,0.15) inset,0 24px 64px rgba(0,0,0,0.55)',
        'overflow:hidden','padding:8px','min-width:160px','font-family:Sora,sans-serif',
        'transform-origin:' + (isWave ? 'bottom center' : 'top center'),
        isWave ? 'animation:slWaveSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both'
               : 'animation:slBubblePop 0.45s cubic-bezier(0.22,1,0.36,1) both',
      ].join(';');
      _slInjectStyles(isWave);

      var itemsHtml = isWave ? '' : '<div class="sl-pop-shimmer"></div>';
      for (var fmi = 0; fmi < modes.length; fmi++) {
        var fmVal   = modes[fmi];
        var fmIdx   = FAN_LEVELS.indexOf(fmVal);
        var fmLbl   = acFanLabel(tr2, fmVal);
        var fmDelay = (fmi * 0.04 + 0.03).toFixed(2) + 's';
        var fmIcon  = fmVal === 'auto' ? '🔄' : fmVal === 'max' ? '💨' : fmVal === 'min' ? '🍃'
                    : fmVal === 'quiet' ? '🌙' : fmVal === 'low/auto' ? '🔄' : fmVal === 'high/auto' ? '💨' : '💨';
        if (isWave) {
          itemsHtml += '<div class="sl-ri sl-ri-wave' + (curFan === fmVal ? ' active' : '') + '" data-fan-val="' + fmVal + '" style="animation-delay:' + fmDelay + '">'
            + '<span style="font-size:18px;line-height:1;width:22px;text-align:center">' + fmIcon + '</span>'
            + '<span style="flex:1">' + fmLbl + '</span>'
            + '<div class="sl-wave-ripple"></div></div>';
        } else {
          itemsHtml += '<div class="sl-ri' + (curFan === fmVal ? ' active' : '') + '" data-fan-val="' + fmVal + '" style="animation-delay:' + fmDelay + '">'
            + '<span style="font-size:18px;line-height:1;width:22px;text-align:center">' + fmIcon + '</span>'
            + '<span style="flex:1">' + fmLbl + '</span></div>';
        }
      }
      pop.innerHTML = itemsHtml;

      var fanBtn = r.getElementById('sl-btn-fan-sl');
      var btnRect = fanBtn ? fanBtn.getBoundingClientRect() : {left:0,right:160,top:0,bottom:40,width:160};
      var popWidth = Math.max(btnRect.width, 160);
      var popLeft  = btnRect.left;
      if (popLeft + popWidth > window.innerWidth - 8) popLeft = window.innerWidth - popWidth - 8;
      if (isWave) { pop.style.bottom = (window.innerHeight - btnRect.top + 6) + 'px'; pop.style.top = 'auto'; }
      else        { pop.style.top    = (btnRect.bottom + 6) + 'px'; }
      pop.style.left = popLeft + 'px';
      pop.style.width = popWidth + 'px';
      document.body.appendChild(pop);
      slFanPopupEl = pop;

      pop.querySelectorAll('[data-fan-val]').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          if (isWave) _slWaveRipple(item, e);
          var val = item.dataset.fanVal;
          var doCall = function() { self._call('climate','set_fan_mode',{entity_id:id, fan_mode:val}); closeSlFanPopup(); };
          isWave ? setTimeout(doCall, 220) : doCall();
        });
      });
      overlay.addEventListener('click', closeSlFanPopup);
    }
    var slFanBtnEl = r.getElementById('sl-btn-fan-sl');
    if (slFanBtnEl) slFanBtnEl.addEventListener('click', function(e) { e.stopPropagation(); openSlFanPopup(); });
    function onOutsideSlFanClick(e) {
      if (!slFanPopupEl) return;
      if (slFanPopupEl.contains(e.target)) return;
      var fb = r.getElementById('sl-btn-fan-sl'); if (fb && fb.contains(e.target)) return;
      closeSlFanPopup();
    }
    document.addEventListener('click', onOutsideSlFanClick);
    var prevSlCleanup1 = self._slCleanup;
    self._slCleanup = function() { document.removeEventListener('click', onOutsideSlFanClick); closeSlFanPopup(); if (prevSlCleanup1) prevSlCleanup1(); };

    // Swing cycle (Super Lite mini button)
    onTapSL(r.getElementById('sl-btn-swing-sl'), function() {
      var id = ROOMS[self._activeIdx].id;
      var cur = self._a(id,'swing_mode') || 'off';
      // Cycle only through the entity's real swing_modes
      var supported = self._a(id,'swing_modes');
      var levels = (Array.isArray(supported) && supported.length > 0) ? supported : SWING_LEVELS;
      var idx = levels.indexOf(cur);
      // idx = -1 means the current mode is unsupported → reset to the start of the list instead of getting stuck
      var next = idx >= 0 ? levels[(idx + 1) % levels.length] : levels[0];
      self._call('climate','set_swing_mode',{entity_id:id, swing_mode:next});
    });

    // Gear → more-info
    onTapSL(r.getElementById('sl-btn-gear'), function() {
      self.dispatchEvent(new CustomEvent('hass-more-info', {
        bubbles: true, composed: true,
        detail: { entityId: ROOMS[self._activeIdx].id }
      }));
    });

    // Horizontal swing cycle (Super Lite mini button)
    onTapSL(r.getElementById('sl-btn-hswing-sl'), function() {
      var id = ROOMS[self._activeIdx].id;
      var supported = self._a(id, 'swing_horizontal_modes');
      if (!Array.isArray(supported) || !supported.length) return;
      var cur = self._a(id,'swing_horizontal_mode') || supported[0];
      var idx = supported.indexOf(cur);
      var next = idx >= 0 ? supported[(idx + 1) % supported.length] : supported[0];
      self._call('climate','set_swing_horizontal_mode',{entity_id:id, swing_horizontal_mode:next});
    });

    // View mode switcher (super lite)
    onTapSL(r.getElementById('sl-vs-full'), function() {
      self._config = Object.assign({}, self._config, { view_mode: 'full' });
      self._renderFull();
    });
    onTapSL(r.getElementById('sl-vs-lite'), function() {
      self._config = Object.assign({}, self._config, { view_mode: 'lite' });
      self._renderFull();
    });
    onTapSL(r.getElementById('sl-vs-superlite'), function() {
      self._config = Object.assign({}, self._config, { view_mode: 'super_lite' });
      self._renderFull();
    });

    // Mode dropdown (native select — Normal style)
    var modeSelect = r.getElementById('sl-mode-select');
    if (modeSelect) {
      modeSelect.addEventListener('change', function() {
        var id = ROOMS[self._activeIdx].id;
        var newMode = modeSelect.value;
        // If currently off → remember the current HVAC mode before switching off
        if (newMode === 'off') {
          var curHvac = self._s(id);
          if (curHvac && curHvac !== 'off') self._hvacModeSave(id, curHvac);
        }
        self._call('climate','set_hvac_mode',{entity_id:id, hvac_mode: newMode});
      });
    }

    // Room dropdown (native select — Normal style)
    var roomSelect = r.getElementById('sl-room-select');
    if (roomSelect) {
      roomSelect.addEventListener('change', function() {
        var idx = parseInt(roomSelect.value);
        if (!isNaN(idx) && idx !== self._activeIdx) {
          self._setActiveRoom(idx);
          self._renderFull();
        }
      });
    }

    // ── Shared style injector (effect + wave keyframes) ──────────────────────
    function _slInjectStyles(isWave) {
      var id = isWave ? 'sl-wave-style' : 'sl-bubble-style';
      if (document.getElementById(id)) return;
      var st = document.createElement('style');
      st.id = id;
      if (isWave) {
        st.textContent = [
          /* popup slides up from the bottom */
          '@keyframes slWaveSlideUp{',
          '  0%  {opacity:0;transform:translateY(100%) scaleX(0.85);filter:blur(8px)}',
          '  55% {opacity:1;transform:translateY(-6%) scaleX(1.02);filter:blur(0)}',
          '  75% {transform:translateY(2%) scaleX(0.99)}',
          '  100%{transform:translateY(0) scaleX(1)}',
          '}',
          /* each item waves in from the left, with a glow sweep */
          '@keyframes slWaveItem{',
          '  0%  {opacity:0;transform:translateX(-24px);filter:blur(4px)}',
          '  60% {opacity:1;transform:translateX(4px);filter:blur(0)}',
          '  80% {transform:translateX(-2px)}',
          '  100%{transform:translateX(0)}',
          '}',
          /* ripple spreads out on selection */
          '@keyframes slRippleOut{',
          '  0%  {transform:scale(0);opacity:0.7}',
          '  100%{transform:scale(3.5);opacity:0}',
          '}',
          '.sl-ri{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:14px;',
          '  cursor:pointer;font-family:Sora,sans-serif;font-size:13px;font-weight:600;',
          '  color:rgba(255,255,255,0.88);transition:background 0.15s,transform 0.12s;',
          '  white-space:nowrap;position:relative;overflow:hidden}',
          '.sl-ri-wave{animation:slWaveItem 0.38s cubic-bezier(0.22,1,0.36,1) both}',
          '.sl-ri:hover{background:rgba(255,255,255,0.09);transform:scale(1.01)}',
          '.sl-ri:active{transform:scale(0.97)}',
          '.sl-ri.active{background:linear-gradient(100deg,rgba(59,130,246,0.28),rgba(139,92,246,0.18));',
          '  color:#fff;box-shadow:inset 0 0 0 1px rgba(120,180,255,0.25)}',
          '.sl-ri+.sl-ri{border-top:1px solid rgba(255,255,255,0.05)}',
          '.sl-ri-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;flex-shrink:0;letter-spacing:0.8px}',
          '.sl-ri-badge.on{background:rgba(52,211,153,0.18);color:#34d399;box-shadow:0 0 10px rgba(52,211,153,0.35)}',
          '.sl-ri-badge.off{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.32)}',
          '.sl-ri-badge.offline{background:rgba(248,113,113,0.15);color:#f87171;border:1px solid rgba(248,113,113,0.4);animation:offlinePulse 2s ease-in-out infinite}',
          '@keyframes offlinePulse{0%,100%{opacity:1}50%{opacity:0.5}}',
          /* ripple element */
          '.sl-wave-ripple{position:absolute;border-radius:50%;pointer-events:none;',
          '  background:radial-gradient(circle,rgba(120,180,255,0.55) 0%,transparent 70%);',
          '  width:60px;height:60px;margin-left:-30px;margin-top:-30px;',
          '  animation:slRippleOut 0.5s cubic-bezier(0.4,0,0.2,1) both;',
          '  display:none}',
        ].join('\n');
      } else {
        st.textContent = [
          '@keyframes slBubblePop{',
          '  0%  {opacity:0;transform:scale(0.25);filter:blur(18px)}',
          '  40% {opacity:1;filter:blur(2px)}',
          '  65% {transform:scale(1.10);filter:blur(0)}',
          '  82% {transform:scale(0.96)}',
          '  92% {transform:scale(1.03)}',
          '  100%{transform:scale(1)}',
          '}',
          '@keyframes slSpark{',
          '  0%  {transform:scale(0)   rotate(0deg);  opacity:0.9}',
          '  40% {transform:scale(1.6) rotate(25deg); opacity:0.7}',
          '  100%{transform:scale(0)   rotate(50deg); opacity:0}',
          '}',
          '@keyframes slItemIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}',
          '.sl-ri{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:14px;',
          '  cursor:pointer;font-family:Sora,sans-serif;font-size:13px;font-weight:600;',
          '  color:rgba(255,255,255,0.88);transition:background 0.15s,transform 0.12s;',
          '  white-space:nowrap;animation:slItemIn 0.3s cubic-bezier(0.22,1,0.36,1) both}',
          '.sl-ri:hover{background:rgba(255,255,255,0.09);transform:scale(1.02)}',
          '.sl-ri:active{transform:scale(0.96)}',
          '.sl-ri.active{background:linear-gradient(100deg,rgba(59,130,246,0.28),rgba(139,92,246,0.18));',
          '  color:#fff;box-shadow:inset 0 0 0 1px rgba(120,180,255,0.25)}',
          '.sl-ri+.sl-ri{border-top:1px solid rgba(255,255,255,0.05)}',
          '.sl-ri-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;flex-shrink:0;letter-spacing:0.8px}',
          '.sl-ri-badge.on{background:rgba(52,211,153,0.18);color:#34d399;box-shadow:0 0 10px rgba(52,211,153,0.35)}',
          '.sl-ri-badge.off{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.32)}',
          '.sl-ri-badge.offline{background:rgba(248,113,113,0.15);color:#f87171;border:1px solid rgba(248,113,113,0.4);animation:offlinePulse 2s ease-in-out infinite}',
          '@keyframes offlinePulse{0%,100%{opacity:1}50%{opacity:0.5}}',
          '.sl-pop-shimmer{position:absolute;top:0;left:8%;right:8%;height:1px;pointer-events:none;',
          '  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)}',
          '.sl-spark{position:absolute;width:28px;height:28px;pointer-events:none;border-radius:50%;',
          '  animation:slSpark 0.7s cubic-bezier(0.22,1,0.36,1) both;',
          '  background:radial-gradient(circle,rgba(180,210,255,0.95) 0%,rgba(100,160,255,0.45) 50%,transparent 100%);',
          '  filter:blur(2px)}',
          '.sl-spark-tl{top:-12px;left:-12px;animation-delay:0s}',
          '.sl-spark-tr{top:-12px;right:-12px;animation-delay:0.05s}',
          '.sl-spark-bl{bottom:-12px;left:-12px;animation-delay:0.10s}',
          '.sl-spark-br{bottom:-12px;right:-12px;animation-delay:0.15s}',
        ].join('\n');
      }
      document.head.appendChild(st);
    }

    // ── Ripple helper cho Wave style ─────────────────────────────────────────
    function _slWaveRipple(item, e) {
      var ripple = item.querySelector('.sl-wave-ripple');
      if (!ripple) return;
      var rect = item.getBoundingClientRect();
      var x = (e.clientX || (rect.left + rect.width / 2)) - rect.left;
      var y = (e.clientY || (rect.top  + rect.height / 2)) - rect.top;
      ripple.style.left = x + 'px';
      ripple.style.top  = y + 'px';
      ripple.style.display = 'block';
      ripple.style.animation = 'none';
      void ripple.offsetWidth; // reflow
      ripple.style.animation = 'slRippleOut 0.5s cubic-bezier(0.4,0,0.2,1) both';
    }

    // ── Mode popup ───────────────────────────────────────────────────────────
    var modeBtn    = r.getElementById('sl-mode-btn');
    var modeBtnArrow = r.getElementById('sl-mode-btn-arrow');
    var slModePopupEl = null;

    function closeModePopup() {
      if (slModePopupEl && slModePopupEl.parentNode) {
        slModePopupEl.parentNode.removeChild(slModePopupEl);
        slModePopupEl = null;
      }
      var ov = document.getElementById('sl-mode-overlay-global');
      if (ov) ov.parentNode.removeChild(ov);
      if (modeBtnArrow) modeBtnArrow.classList.remove('open');
    }

    function openModePopup() {
      if (slModePopupEl) { closeModePopup(); return; }
      var lang2 = (self._config && self._config.language) || 'en';
      var tr2   = AC_TRANSLATIONS[lang2] || AC_TRANSLATIONS.zh;
      var isWave = (self._config && self._config.popup_style) === 'wave';

      var overlay = document.createElement('div');
      overlay.id = 'sl-mode-overlay-global';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:transparent';
      document.body.appendChild(overlay);

      var pop = document.createElement('div');
      pop.style.cssText = [
        'position:fixed',
        'z-index:9999',
        'background:rgba(8,20,48,0.55)',
        'border:1px solid rgba(255,255,255,0.20)',
        'border-top:1px solid rgba(255,255,255,0.35)',
        'border-radius:22px',
        'backdrop-filter:blur(48px) saturate(2) brightness(1.1)',
        '-webkit-backdrop-filter:blur(48px) saturate(2) brightness(1.1)',
        'box-shadow:0 2px 0 rgba(255,255,255,0.15) inset,0 24px 64px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.06)',
        'overflow:hidden',
        'padding:8px',
        'min-width:180px',
        'font-family:Sora,sans-serif',
        'transform-origin:' + (isWave ? 'bottom center' : 'top center'),
        isWave
          ? 'animation:slWaveSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both'
          : 'animation:slBubblePop 0.45s cubic-bezier(0.22,1,0.36,1) both',
      ].join(';');

      _slInjectStyles(isWave);

      var modeList = ['off','auto','cool','heat','dry','fan_only'];
      var slModeShowMap2 = { auto: 'show_auto', cool: 'show_cool', heat: 'show_heat', dry: 'show_dry', fan_only: 'show_fan_only' };
      var curHvac  = self._s(ROOMS[self._activeIdx].id);
      var itemsHtml = isWave ? '' : '<div class="sl-pop-shimmer"></div>';
      for (var mi = 0; mi < modeList.length; mi++) {
        var mk2  = modeList[mi];
        if (mk2 === 'auto' && !(self._config && self._config.show_auto === true)) continue;
        if (mk2 !== 'off' && mk2 !== 'auto' && (self._config && self._config[slModeShowMap2[mk2]] === false)) continue;
        var mcfg = MODE_CFG[mk2] || MODE_CFG.off;
        var mlbl = tr2.modes[mk2] || mcfg.lbl;
        var delay = (mi * 0.04 + 0.03).toFixed(2) + 's';
        if (isWave) {
          var icHtml3 = (mcfg.icon && mcfg.icon.indexOf('mdi:') === 0)
            ? '<ha-icon icon="' + mcfg.icon + '" style="--mdc-icon-size:20px;--mdc-icon-color:' + mcfg.color + ';width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;color:' + mcfg.color + '"></ha-icon>'
            : '<span style="font-size:18px;line-height:1">' + mcfg.icon + '</span>';
          itemsHtml += '<div class="sl-ri sl-ri-wave' + (curHvac === mk2 ? ' active' : '') + '" data-mode-val="' + mk2 + '" style="animation-delay:' + delay + '">'
            + '<span style="width:22px;text-align:center;display:inline-flex;align-items:center;justify-content:center">' + icHtml3 + '</span>'
            + '<span style="flex:1">' + mlbl + '</span>'
            + '<div class="sl-wave-ripple"></div>'
            + '</div>';
        } else {
          var icHtml4 = (mcfg.icon && mcfg.icon.indexOf('mdi:') === 0)
            ? '<ha-icon icon="' + mcfg.icon + '" style="--mdc-icon-size:20px;--mdc-icon-color:' + mcfg.color + ';width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;color:' + mcfg.color + '"></ha-icon>'
            : '<span style="font-size:18px;line-height:1">' + mcfg.icon + '</span>';
          itemsHtml += '<div class="sl-ri' + (curHvac === mk2 ? ' active' : '') + '" data-mode-val="' + mk2 + '" style="animation-delay:' + delay + '">'
            + '<span style="width:22px;text-align:center;display:inline-flex;align-items:center;justify-content:center">' + icHtml4 + '</span>'
            + '<span style="flex:1">' + mlbl + '</span>'
            + '</div>';
        }
      }
      pop.innerHTML = itemsHtml;

      var btnRect2 = modeBtn.getBoundingClientRect();
      var popWidth2 = Math.max(btnRect2.width, 180);
      var popLeft2 = btnRect2.left;
      if (popLeft2 + popWidth2 > window.innerWidth - 8) popLeft2 = window.innerWidth - popWidth2 - 8;
      if (isWave) {
        pop.style.bottom = (window.innerHeight - btnRect2.top + 6) + 'px';
        pop.style.top = 'auto';
      } else {
        pop.style.top  = (btnRect2.bottom + 6) + 'px';
      }
      pop.style.left  = popLeft2 + 'px';
      pop.style.width = popWidth2 + 'px';

      document.body.appendChild(pop);
      slModePopupEl = pop;
      if (modeBtnArrow) modeBtnArrow.classList.add('open');

      pop.querySelectorAll('[data-mode-val]').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          if (isWave) _slWaveRipple(item, e);
          var modeVal = item.dataset.modeVal;
          var id = ROOMS[self._activeIdx].id;
          var doCall = function() {
            if (modeVal === 'off') { var ch = self._s(id); if (ch && ch !== 'off') self._hvacModeSave(id, ch); }
            self._call('climate','set_hvac_mode',{entity_id:id, hvac_mode: modeVal}); closeModePopup();
          };
          isWave ? setTimeout(doCall, 220) : doCall();
        });
      });

      overlay.addEventListener('click', closeModePopup);
    }

    if (modeBtn) {
      modeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openModePopup();
      });
    }

    function onOutsideModeClick(e) {
      if (!slModePopupEl) return;
      if (slModePopupEl.contains(e.target)) return;
      if (modeBtn && modeBtn.contains(e.target)) return;
      closeModePopup();
    }
    document.addEventListener('click', onOutsideModeClick);
    var origSlCleanup = self._slCleanup;
    self._slCleanup = function() {
      document.removeEventListener('click', onOutsideModeClick);
      closeModePopup();
      if (origSlCleanup) origSlCleanup();
    };

    // ── Custom room dropdown ─────────────────────────────────────────────────
    var roomBtn   = r.getElementById('sl-room-btn');
    var roomArrow = r.getElementById('sl-room-btn-arrow');
    var roomBtnTxt = r.getElementById('sl-room-btn-txt');
    var slRoomPopupEl = null;

    function closeRoomPopup() {
      if (slRoomPopupEl && slRoomPopupEl.parentNode) {
        slRoomPopupEl.parentNode.removeChild(slRoomPopupEl);
        slRoomPopupEl = null;
      }
      // Remove overlay
      var ov = document.getElementById('sl-room-overlay-global');
      if (ov) ov.parentNode.removeChild(ov);
      if (roomArrow) roomArrow.classList.remove('open');
    }

    function openRoomPopup() {
      if (slRoomPopupEl) { closeRoomPopup(); return; }
      var isWave = (self._config && self._config.popup_style) === 'wave';

      // Transparent overlay in real DOM (needed for backdrop-filter stacking context)
      var overlay = document.createElement('div');
      overlay.id = 'sl-room-overlay-global';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:transparent';
      document.body.appendChild(overlay);

      // Popup is appended to document.body — outside the shadow DOM
      // so backdrop-filter gets a proper stacking context
      var pop = document.createElement('div');
      pop.style.cssText = [
        'position:fixed',
        'z-index:9999',
        'background:rgba(8,20,48,0.55)',
        'border:1px solid rgba(255,255,255,0.20)',
        'border-top:1px solid rgba(255,255,255,0.35)',
        'border-radius:22px',
        'backdrop-filter:blur(48px) saturate(2) brightness(1.1)',
        '-webkit-backdrop-filter:blur(48px) saturate(2) brightness(1.1)',
        'box-shadow:0 2px 0 rgba(255,255,255,0.15) inset,0 24px 64px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.06)',
        'overflow:hidden',
        'padding:8px',
        'min-width:220px',
        'font-family:Sora,sans-serif',
        'transform-origin:' + (isWave ? 'bottom center' : 'top center'),
        isWave
          ? 'animation:slWaveSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both'
          : 'animation:slBubblePop 0.45s cubic-bezier(0.22,1,0.36,1) both',
      ].join(';');

      _slInjectStyles(isWave);

      // Build items
      var itemsHtml = isWave ? '' : (
          '<div class="sl-pop-shimmer"></div>'
        + '<div class="sl-spark sl-spark-tl"></div>'
        + '<div class="sl-spark sl-spark-tr"></div>'
        + '<div class="sl-spark sl-spark-bl"></div>'
        + '<div class="sl-spark sl-spark-br"></div>'
      );
      for (var ri2 = 0; ri2 < ROOMS.length; ri2++) {
        var ri2State = self._s(ROOMS[ri2].id);
        var ri2Offline = (ri2State === 'unavailable' || ri2State === 'unknown');
        if (ri2Offline) ri2State = 'off';
        var ri2On = ri2State !== 'off';
        var ri2Temp = parseFloat(self._a(ROOMS[ri2].id, 'current_temperature') || 0);
        var ri2TUnit = (self._config && self._config.temp_unit) || 'C';
        var ri2HaUnit = ri2Temp > 50 ? 'F' : 'C';
        var ri2TempStr = ri2Temp > 0 ? ' · ' + acTempWithUnit(ri2Temp, ri2TUnit, ri2HaUnit) : '';
        var ri2HumRaw = parseFloat(self._a(ROOMS[ri2].id, 'current_humidity') || self._a(ROOMS[ri2].id, 'humidity') || 0);
        var ri2EntH = (self._config && self._config.entities && self._config.entities[ri2]) || {};
        if (ri2EntH.humidity_entity && self._hass && self._hass.states[ri2EntH.humidity_entity]) { var ri2HS = parseFloat(self._hass.states[ri2EntH.humidity_entity].state); if (!isNaN(ri2HS)) ri2HumRaw = ri2HS; }
        var ri2HumStr = ri2HumRaw > 0 ? ' · 💧' + Math.round(ri2HumRaw) + '%' : '';
        var ri2IconColor = ri2Offline ? 'rgba(255,255,255,0.3)' : (ri2On ? (MODE_CFG[ri2State] || MODE_CFG.cool).color : 'rgba(255,255,255,0.55)');
        var ri2IconHtml = self._mdiIcon(ROOMS[ri2].icon, 18, ri2IconColor);
        var ri2LabelText = escHtml(ROOMS[ri2].label) + (ri2Offline ? '' : ri2TempStr + ri2HumStr);
        var ri2BadgeClass = ri2Offline ? 'sl-ri-badge offline' : (ri2On ? 'sl-ri-badge on' : 'sl-ri-badge off');
        var ri2BadgeText  = ri2Offline ? tr.badgeOffline : (ri2On ? tr.badgeOn : tr.badgeOff);
        var delay = (ri2 * 0.03 + 0.03).toFixed(2) + 's';
        if (isWave) {
          itemsHtml += '<div class="sl-ri sl-ri-wave' + (ri2 === self._activeIdx ? ' active' : '') + '" data-room-idx="' + ri2 + '" style="animation-delay:' + delay + '">'
            + '<span style="flex:1;display:flex;align-items:center;gap:6px">' + ri2IconHtml + '<span>' + ri2LabelText + '</span></span>'
            + '<span class="' + ri2BadgeClass + '">' + ri2BadgeText + '</span>'
            + '<div class="sl-wave-ripple"></div>'
            + '</div>';
        } else {
          itemsHtml += '<div class="sl-ri' + (ri2 === self._activeIdx ? ' active' : '') + '" data-room-idx="' + ri2 + '" style="animation-delay:' + delay + '">'
            + '<span style="flex:1;display:flex;align-items:center;gap:6px">' + ri2IconHtml + '<span>' + ri2LabelText + '</span></span>'
            + '<span class="' + ri2BadgeClass + '">' + ri2BadgeText + '</span>'
            + '</div>';
        }
      }
      pop.innerHTML = itemsHtml;

      // Position
      var btnRect = roomBtn.getBoundingClientRect();
      var popWidth = Math.max(btnRect.width, 220);
      var popLeft  = btnRect.left;
      if (popLeft + popWidth > window.innerWidth - 8) popLeft = window.innerWidth - popWidth - 8;
      if (isWave) {
        pop.style.bottom = (window.innerHeight - btnRect.top + 6) + 'px';
        pop.style.top = 'auto';
      } else {
        pop.style.top = (btnRect.bottom + 6) + 'px';
      }
      pop.style.left  = popLeft + 'px';
      pop.style.width = popWidth + 'px';

      document.body.appendChild(pop);
      slRoomPopupEl = pop;
      if (roomArrow) roomArrow.classList.add('open');

      // Item click
      pop.querySelectorAll('[data-room-idx]').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          if (isWave) _slWaveRipple(item, e);
          var idx = parseInt(item.dataset.roomIdx);
          var doSwitch = function() {
            self._setActiveRoom(idx);
            closeRoomPopup();
            self._renderFull();
          };
          isWave ? setTimeout(doSwitch, 220) : doSwitch();
        });
      });

      // Overlay click closes
      overlay.addEventListener('click', closeRoomPopup);
    }

    if (roomBtn) {
      roomBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openRoomPopup();
      });
    }

    // Close popup on outside click (popup is in document.body now)
    function onOutsideClick(e) {
      if (!slRoomPopupEl) return;
      if (slRoomPopupEl.contains(e.target)) return;
      if (roomBtn && roomBtn.contains(e.target)) return;
      closeRoomPopup();
    }
    document.addEventListener('click', onOutsideClick);
    // Clean up listener when card is disconnected — chain with any existing cleanup (e.g. mode popup)
    var prevCleanup = self._slCleanup;
    self._slCleanup = function() { document.removeEventListener('click', onOutsideClick); closeRoomPopup(); if (prevCleanup) prevCleanup(); };
  }

  // ── 10s interval: refresh the live temperature + ETA even when HA does not push ──
  _startRefresh() {
    if (this._refreshInt) return; // already exists
    var self = this;
    this._refreshInt = setInterval(function() {
      if (!self._hass || !self._initialized) return;
      var h = self._hass;
      var nowMs = Date.now();
      var histDirty = false;

      // Record temperature history for every room (same logic as in set hass)
      for (var ri = 0; ri < ROOMS.length; ri++) {
        var rid = ROOMS[ri].id;
        var rTemp = parseFloat(self._attrOf(h, rid, 'current_temperature'));
        var rMode = self._stateOf(h, rid);
        if (!isNaN(rTemp) && rMode === 'cool') {
          if (!self._tempHistory[ri]) self._tempHistory[ri] = [];
          var hist = self._tempHistory[ri];
          var last = hist[hist.length - 1];
          // Record a new point every 10s (even if the temperature is unchanged — to track real time)
          if (!last || (nowMs - last.t) >= 9000) {
            if (!last || Math.abs(last.temp - rTemp) >= 0.01 || (nowMs - last.t) >= 30000) {
              hist.push({ t: nowMs, temp: rTemp });
              if (hist.length > 60) hist.splice(0, hist.length - 60);
              histDirty = true;
            }
          }
        }
      }
      if (histDirty) {
        try { localStorage.setItem('ac_temp_history_v2', JSON.stringify(self._tempHistory)); } catch(e) {}
      }

      // Patch only the elements that changed — do NOT rebuild the whole DOM (that flickers)
      self._patchLiveData();
    }, 10000);
  }

  // ── Patch the live display elements without rebuilding the whole card ────────
  _patchLiveData() {
    if (!this._hass || !this._initialized) return;
    var sr = this.shadowRoot;
    if (!sr) return;

    var cfg     = this._config || {};
    var lang    = cfg.language || 'en';
    var tr      = AC_TRANSLATIONS[lang] || AC_TRANSLATIONS.en;
    var room    = ROOMS[this._activeIdx];
    var hvac    = this._s(room.id);
    var isOn    = hvac !== 'off';
    var curTemp = parseFloat(this._a(room.id, 'current_temperature') || 26);
    var setTemp = parseFloat(this._a(room.id, 'temperature') || 24);
    var fanMode = this._a(room.id, 'fan_mode') || 'auto';

    // Live temperature from the dedicated sensor, when present
    var roomEntCfg = (cfg.entities && cfg.entities[this._activeIdx]) || {};
    if (roomEntCfg.temp_entity && this._hass.states[roomEntCfg.temp_entity]) {
      var st = parseFloat(this._hass.states[roomEntCfg.temp_entity].state);
      if (!isNaN(st)) curTemp = st;
    }

    // ── Patch the displayed temperature ──────────────────────────────────────────
    var tUnit2  = cfg.temp_unit || 'C';
    var haUnit2 = curTemp > 50 ? 'F' : 'C';
    var curTempC = haUnit2 === 'F' ? acFtoC(curTemp) : curTemp;
    var setTempC2 = haUnit2 === 'F' ? acFtoC(setTemp) : setTemp;
    var tempEl = sr.getElementById('live-cur-temp');
    if (tempEl) {
      var color = acTempColor(curTempC);
      tempEl.style.color = color;
      tempEl.style.textShadow = '0 0 30px ' + color + ',0 0 60px ' + color;
      var firstNode = tempEl.firstChild;
      var tempStr = acFmtTemp(curTemp, tUnit2, haUnit2);
      if (firstNode && firstNode.nodeType === 3) {
        if (firstNode.textContent !== tempStr) firstNode.textContent = tempStr;
      }
    }

    // ── Patch set-temp display ───────────────────────────────────────────
    var setTempEl = sr.getElementById('live-set-temp');
    if (setTempEl) {
      var setTempVal = String(acFmtSetTemp(setTemp, tUnit2, haUnit2));
      var setTempNode = setTempEl.firstChild;
      if (setTempNode && setTempNode.nodeType === 3) {
        if (setTempNode.textContent !== setTempVal) setTempNode.textContent = setTempVal;
      }
    }

    // ── Patch comfort text ───────────────────────────────────────────────
    var comfortEl = sr.getElementById('live-comfort');
    if (comfortEl) {
      // setTempC2 is already computed above for the set-point display
      var comfortTxt = acComfortText(tr, hvac, curTempC, setTempC2);
      if (comfortEl.textContent !== comfortTxt) comfortEl.textContent = comfortTxt;
    }

    // ── Patch ETA bar ─────────────────────────────────────────────────────
    var setTempDisp2 = acFmtSetTemp(setTemp, tUnit2, haUnit2);
    var degSym2 = tUnit2 === 'F' ? '°F' : '°C';
    var etaEl = sr.getElementById('live-eta');
    if (hvac === 'cool' && isOn) {
      var eta = this._calcEta(this._activeIdx, setTempC2, curTempC, fanMode);
      if (eta) {
        var prefix = eta.mode === 'estimated' ? '⏱~ ' : '⏱ ';
        var etaTxt = tr.etaText(prefix, setTempDisp2, degSym2, eta.eta);
          ;
        if (etaEl) {
          if (etaEl.textContent !== etaTxt) etaEl.textContent = etaTxt;
          etaEl.style.display = '';
        } else {
          // The ETA element does not exist yet → skip it; a full re-render would kill the animation
        }
      } else if (etaEl) {
        etaEl.style.display = 'none';
      }
    } else if (etaEl) {
      etaEl.style.display = 'none';
    }

    // ── Patch sensor values (outdoor temp, outdoor humidity, PM2.5) ───────
    // Patch the strip by its stable data-sens hook. A reading that appears or
    // disappears is handled by hiding / showing the cell, never by writing a
    // placeholder -- a bare "--°" in a numeric cell reads as a measurement.
    var stripVals = acSensorStripValues(this, cfg, room, tUnit2);
    // A reading that arrives after the first paint has no pill to unhide: the
    // list is built from the values present at load, and this patch only shows or
    // hides pills that already exist. When the strip is out of date, or absent
    // entirely, rebuild -- otherwise a sensor that comes online an hour later
    // never appears.
    // Only the two keys that are actually pills. pm25 must NOT be here: it
    // lives in the ring, so it has no .sens cell, and listing it made
    // stripOutOfDate permanently true -- a full re-render every 10 seconds,
    // which collapsed the card's columns.
    var stripKeys = ['out-temp', 'out-hum'];
    var stripRow = sr.querySelector('.sens-row');
    var stripOutOfDate = !stripRow;
    if (stripRow) {
      stripKeys.forEach(function (k) {
        var want = stripVals[k];
        if (want === null || want === undefined) return;
        if (!stripRow.querySelector('.sens[data-sens="' + k + '"]')) stripOutOfDate = true;
      });
    }
    if (stripOutOfDate) { this._renderFull(); return; }
    if (stripRow) {
      Array.prototype.slice.call(stripRow.querySelectorAll('.sens')).forEach(function(chip) {
        var v = stripVals[chip.dataset.sens];
        var hide = (v === null || v === undefined);
        if (chip.style.display !== (hide ? 'none' : '')) chip.style.display = hide ? 'none' : '';
        if (!hide) {
          var valEl = chip.querySelector('.sens-val');
          if (valEl && valEl.textContent !== v) valEl.textContent = v;
        }
      });
    }

    // PM2.5 needs its own update path. It used to be one more cell in this row;
    // it is now a ring next to the status text, and nothing here touched it --
    // so the number froze at whatever the sensor said when the card loaded, and
    // a sensor that started or stopped reporting never changed the card.
    // This must stay BELOW `var stripVals`: stripVals is hoisted, so reading it
    // any higher up yields undefined and stripVals['pm25'] throws.
    var pmRing = sr.querySelector('.pm-ring');
    if (pmRing) {
      var pmNow = stripVals['pm25'];
      if (pmNow === null || pmNow === undefined) {
        pmRing.style.display = 'none';
      } else {
        pmRing.style.display = '';
        var pmValEl = pmRing.querySelector('.pm-val');
        if (pmValEl && pmValEl.textContent !== pmNow) pmValEl.textContent = pmNow;
      }
    }
  }

  _startClock() {
    var self = this;
    if (this._clockInt) return; // already exists → do not create another
    this._clockInt = setInterval(function() {
      var el = self.shadowRoot && self.shadowRoot.getElementById('clock-display');
      if (el) el.textContent = new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
    }, 30000);
  }

  // ── Timer per-room ────────────────────────────────────────────────────────
  _fmtRemain(roomIdx) {
    var t = this._timers[roomIdx];
    if (!t || !t.end) return '';
    var rem = t.end - Date.now();
    if (rem <= 0) return '';
    var m = Math.ceil(rem / 60000);
    var h = Math.floor(m / 60); m = m % 60;
    return h > 0 ? h + 'h' + (m ? m + 'm' : '') : m + 'm';
  }

  _timerSave() {
    try {
      var snap = {};
      var now = Date.now();
      Object.keys(this._timers).forEach(function(idx) {
        var t = this._timers[idx];
        if (t && t.end && t.end > now) {
          snap[idx] = { end: t.end, mode: t.mode, hrs: t.hrs };
        }
      }.bind(this));
      if (Object.keys(snap).length > 0) {
        localStorage.setItem('ac_timer_state_v2', JSON.stringify(snap));
      } else {
        localStorage.removeItem('ac_timer_state_v2');
      }
    } catch(e) {}
  }

  // ── Store / read the last HVAC mode (persists across reloads and other devices on the same domain)
  _hvacModeSave(entityId, mode) {
    this._lastHvacMode = this._lastHvacMode || {};
    this._lastHvacMode[entityId] = mode;
    try { localStorage.setItem('ac_last_hvac_mode_v1', JSON.stringify(this._lastHvacMode)); } catch(e) {}
  }

  _hvacModeLoad(entityId) {
    // 1. Session memory (synced from localStorage when the constructor runs)
    if (this._lastHvacMode && this._lastHvacMode[entityId]) return this._lastHvacMode[entityId];
    // 2. Read localStorage directly (covers a fresh instance on another device)
    try {
      var saved = localStorage.getItem('ac_last_hvac_mode_v1');
      if (saved) {
        var obj = JSON.parse(saved);
        if (obj && obj[entityId]) {
          this._lastHvacMode = this._lastHvacMode || {};
          this._lastHvacMode[entityId] = obj[entityId];
          return obj[entityId];
        }
      }
    } catch(e) {}
    // 3. An attribute the integration stores itself (some brands provide one)
    var attrLast = this._a(entityId, 'last_hvac_mode') || this._a(entityId, 'previous_hvac_mode');
    if (attrLast && attrLast !== 'off') return attrLast;
    // 4. Last-resort fallback
    return null; // null -> the caller uses climate.turn_on instead of set_hvac_mode
  }

  // ── Power the AC on correctly: prefer climate.turn_on (respects the system mode)
  // climate.turn_on is an HA core service: it restores the previous mode through the integration
  // (correct for Mitsubishi City Multi — the central system decides Heat/Cool)
  _turnOn(entityId) {
    var savedMode = this._hvacModeLoad(entityId);
    if (savedMode) {
      // An explicit stored mode (the user picked one in the card) → use set_hvac_mode
      this._call('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: savedMode });
    } else {
      // No stored mode → call turn_on and let the integration / system decide
      // This is the correct behaviour for Mitsubishi City Multi and other central systems
      this._call('climate', 'turn_on', { entity_id: entityId });
    }
  }

  _startTick(roomIdx) {
    var self = this;
    var t = self._timers[roomIdx];
    if (!t) return;
    if (t.int) clearInterval(t.int);
    self._timerSave();
    t.int = setInterval(function() {
      var tr2 = self._timers[roomIdx];
      if (!tr2) { return; }
      var rem = tr2.end - Date.now();
      // Only update the UI if this is the room currently being viewed
      if (self._activeIdx === parseInt(roomIdx)) {
        var el = self.shadowRoot && self.shadowRoot.getElementById('timer-cd');
        var btn2 = self.shadowRoot && (self.shadowRoot.getElementById('btn-timer-left') || self.shadowRoot.getElementById('btn-timer'));
        if (rem <= 0) {
          clearInterval(tr2.int); tr2.int = null;
          delete self._timers[roomIdx];
          self._timerSave();
          if (el)   el.textContent = '';
          if (btn2) btn2.classList.remove('timer-btn--active');
          // Perform the power toggle for that room
          var id = ROOMS[roomIdx].id;
          if (tr2.mode === 'on') {
            self._turnOn(id);
          } else {
            self._call('climate', 'set_hvac_mode', { entity_id: id, hvac_mode: 'off' });
          }
        } else {
          if (el) el.textContent = self._fmtRemain(roomIdx);
        }
      } else {
        // A room running a timer but not currently viewed → only handle the expiry
        if (rem <= 0) {
          clearInterval(tr2.int); tr2.int = null;
          delete self._timers[roomIdx];
          self._timerSave();
          var id2 = ROOMS[roomIdx].id;
          if (tr2.mode === 'on') {
            self._turnOn(id2);
          } else {
            self._call('climate', 'set_hvac_mode', { entity_id: id2, hvac_mode: 'off' });
          }
        }
      }
    }, 10000);
  }

  _bindTimer() {
    var self  = this;
    var sr    = this.shadowRoot;
    // btn-timer-left = full mode, btn-timer = lite mode
    var btn   = sr.getElementById('btn-timer-left') || sr.getElementById('btn-timer');
    var roomIdx = this._activeIdx; // remember the room at bind time
    if (!btn) return;

    var lang = (this._config && this._config.language) || 'en';
    var tr   = AC_TRANSLATIONS[lang] || AC_TRANSLATIONS.en;

    var HOURS     = [0.5, 1, 1.5, 2, 3, 4, 6, 8];
    var HOUR_LBLS = ['30p','1h','1.5h','2h','3h','4h','6h','8h'];

    function closePopup() {
      var p = sr.getElementById('timer-popup-el');
      if (p) p.remove();
      if (self._outsideHandler) {
        document.removeEventListener('click',    self._outsideHandler, true);
        document.removeEventListener('touchend', self._outsideHandler, true);
        self._outsideHandler = null;
      }
    }

    function openPopup() {
      closePopup();
      var cur        = self._timers[roomIdx] || {};
      var chosenH    = cur.hrs || null;
      var chosenMode = cur.mode || 'off';
      var customMin  = '';  // custom minutes

      var pop = document.createElement('div');
      pop.id = 'timer-popup-el';
      pop.className = 'timer-popup';

      var rect = btn.getBoundingClientRect();
      pop.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      pop.style.right  = (window.innerWidth  - rect.right)  + 'px';

      function renderPop() {
        var hasTimer = !!(self._timers[roomIdx] && self._timers[roomIdx].end);
        pop.innerHTML =
          '<div class="tp-title">' + tr.timerTitle + '</div>'
        + '<div class="tp-tabs">'
        +   '<button class="tp-tab ' + (chosenMode==='off'?'tp-tab-off-sel':'') + '" id="tp-off">' + tr.timerOff + '</button>'
        +   '<button class="tp-tab ' + (chosenMode==='on'?'tp-tab-on-sel':'')   + '" id="tp-on" >' + tr.timerOn  + '</button>'
        + '</div>'
        + '<div class="tp-hours">'
        + HOURS.map(function(h, i) {
            var sel = chosenH === h ? (chosenMode==='off'?' tp-h-off':' tp-h-on') : '';
            return '<button class="tp-h' + sel + '" data-h="' + h + '">' + HOUR_LBLS[i] + '</button>';
          }).join('')
        + '</div>'
        + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">'
        +   '<input id="tp-custom-min" type="number" min="1" max="999" placeholder="' + tr.timerMinPlaceholder + '" value="' + customMin + '"'
        +     ' style="flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);border-radius:8px;'
        +     'padding:6px 8px;font-size:11px;font-family:Sora,sans-serif;color:#fff;outline:none;width:0">'
        +   '<span style="font-size:9px;color:rgba(255,255,255,0.45);white-space:nowrap">' + tr.timerMinUnit + '</span>'
        + '</div>'
        + '<div class="tp-acts">'
        +   '<button class="tp-cancel" id="tp-cancel">' + tr.cancel + '</button>'
        +   (hasTimer ? '<button class="tp-del" id="tp-del">' + tr.timerDelete + '</button>' : '')
        +   '<button class="tp-ok ' + (chosenMode==='on'?'tp-ok-on':'tp-ok-off') + '" id="tp-ok">' + tr.timerConfirm + '</button>'
        + '</div>';

        // Bind tabs
        var tabOff = pop.querySelector('#tp-off');
        var tabOn  = pop.querySelector('#tp-on');
        function setMode(m) { chosenMode = m; renderPop(); }
        if (tabOff) tabOff.onclick = function(e){ e.stopPropagation(); setMode('off'); };
        if (tabOn)  tabOn.onclick  = function(e){ e.stopPropagation(); setMode('on');  };

        // Bind the time presets
        pop.querySelectorAll('.tp-h').forEach(function(b) {
          b.onclick = function(e) {
            e.stopPropagation();
            chosenH   = parseFloat(b.dataset.h);
            customMin = '';
            renderPop();
          };
        });

        // Bind the custom input – keeps its value across re-renders
        var custEl = pop.querySelector('#tp-custom-min');
        if (custEl) {
          custEl.addEventListener('input', function() {
            customMin = custEl.value;
            chosenH   = null; // clear the preset selection
          });
          custEl.addEventListener('click', function(e) { e.stopPropagation(); });
          custEl.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: true });
        }

        // Cancel
        var cancelBtn = pop.querySelector('#tp-cancel');
        if (cancelBtn) cancelBtn.onclick = function(e){ e.stopPropagation(); closePopup(); };

        // Delete the timer
        var delBtn = pop.querySelector('#tp-del');
        if (delBtn) delBtn.onclick = function(e) {
          e.stopPropagation();
          var t = self._timers[roomIdx];
          if (t && t.int) clearInterval(t.int);
          delete self._timers[roomIdx];
          self._timerSave();
          var cd = sr.getElementById('timer-cd');
          if (cd) cd.textContent = '';
          btn.classList.remove('timer-btn--active');
          closePopup();
        };

        // Confirm
        var okBtn = pop.querySelector('#tp-ok');
        if (okBtn) okBtn.onclick = function(e) {
          e.stopPropagation();
          // Prefer custom minutes when set
          var custInput = pop.querySelector('#tp-custom-min');
          var mins = custInput && custInput.value ? parseFloat(custInput.value) : 0;
          var finalHrs = mins > 0 ? (mins / 60) : chosenH;
          if (!finalHrs || finalHrs <= 0) { closePopup(); return; }

          // Cancel this room's previous timer (if any)
          var old = self._timers[roomIdx];
          if (old && old.int) clearInterval(old.int);

          self._timers[roomIdx] = { end: Date.now() + finalHrs * 3600000, mode: chosenMode, hrs: finalHrs, int: null };
          btn.classList.add('timer-btn--active');
          var cd = sr.getElementById('timer-cd');
          if (cd) cd.textContent = self._fmtRemain(roomIdx);
          self._startTick(roomIdx);
          closePopup();
        };
      }

      renderPop();
      sr.appendChild(pop);

      self._popupJustOpened = true;
      setTimeout(function() { self._popupJustOpened = false; }, 80);

      function outside(e) {
        if (self._popupJustOpened) return;
        var path = e.composedPath ? e.composedPath() : [];
        if (path.indexOf(pop) === -1 && path.indexOf(btn) === -1) closePopup();
      }
      document.addEventListener('click',    outside, true);
      document.addEventListener('touchend', outside, true);
      self._outsideHandler = outside;
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation(); e.preventDefault();
      if (!sr.getElementById('timer-popup-el')) openPopup();
    });
    btn.addEventListener('touchend', function(e) {
      e.preventDefault(); e.stopPropagation();
      if (!sr.getElementById('timer-popup-el')) openPopup();
    }, { passive: false });
  }

  disconnectedCallback() {
    // A drag in progress keeps the re-render guard closed, so a stranded flag
    // would freeze the card for good. Removal is the one path that can strand
    // it, because it skips pointerup on the detached node.
    this._dialDragging = false;
    if (this._clockInt)   { clearInterval(this._clockInt);   this._clockInt   = null; }
    if (this._refreshInt) { clearInterval(this._refreshInt); this._refreshInt = null; }
    if (this._slCleanup) { this._slCleanup(); this._slCleanup = null; }
    if (this._scaleObs) { this._scaleObs.disconnect(); this._scaleObs = null; }
    // Clear tooltip timers
    if (this._tipAutoHideTimer) { clearTimeout(this._tipAutoHideTimer); this._tipAutoHideTimer = null; }
    this._stopCoolTrailAnim();
    this._stopFanWindAnim();
    this._stopHeatFlameAnim();
    this._stopDryMistAnim();
    if (this._tipFadeTimer)     { clearTimeout(this._tipFadeTimer);     this._tipFadeTimer     = null; }
    if (this._acTip && this._acTip.parentNode) { this._acTip.parentNode.removeChild(this._acTip); this._acTip = null; }
    var self = this;
    Object.keys(this._timers).forEach(function(idx) {
      var t = self._timers[idx];
      if (t && t.int) { clearInterval(t.int); t.int = null; }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
//  VISUAL EDITOR  –  Gate-card style, bilingual, ha-entity-picker
// ═══════════════════════════════════════════════════════════════
class MultiAcCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { ...AC_DEFAULT_CONFIG };
    this._hass   = null;
    this._open   = { roomcount: true, rooms: true, sensors: true, colors: false, bg: true, display: false };
    this._picker = null;
  }

  setConfig(c) {
    this._config = { ...AC_DEFAULT_CONFIG, ...c };
    // Follow HA; ignore any `language:` left over from an older dashboard.
    this._config.language = this._hass ? acLangFromHass(this._hass) : AC_DEFAULT_CONFIG.language;
    this._render();
  }

  set hass(h) {
    this._hass = h;
    // The panel's own labels follow HA too, so a language change has to
    // re-render -- editing state that is not language-dependent is untouched.
    var want = acLangFromHass(h);
    if (this._config && this._config.language !== want) {
      this._config.language = want;
      this._render();
    }
    this._syncPickers();
  }

  get t() { return AC_TRANSLATIONS[this._config.language || 'en'] || AC_TRANSLATIONS.en; }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config }, bubbles: true, composed: true,
    }));
  }

  // ── Inject hass into every ha-entity-picker ───────────────────────────────────
  _syncPickers() {
    if (!this._hass || !this.shadowRoot) return;
    const apply = () => {
      this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(p => {
        p.hass = this._hass;
        const domain = p.dataset.domain;
        if (domain) p.includeDomains = [domain];
        const key   = p.dataset.key;
        const saved = this._config[key] || '';
        if (saved && p.value !== saved) {
          p.value = saved;
          p.setAttribute('value', saved);
        }
      });
      // quick action chips
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-chip]').forEach(p => {
        p.hass = this._hass;
        const saved = ((this._config.preset_chips || [])[parseInt(p.dataset.chip, 10)] || {}).entity_id || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
      // entity pickers for each room
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-room]').forEach(p => {
        p.hass = this._hass;
        p.includeDomains = ['climate'];
        const idx   = parseInt(p.dataset.room);
        const ents  = this._config.entities || [];
        const saved = (ents[idx] && ents[idx].entity_id) || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
      // room temp sensor pickers
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-room-temp]').forEach(p => {
        p.hass = this._hass;
        p.includeDomains = ['sensor'];
        const idx   = parseInt(p.dataset.roomTemp);
        const ents  = this._config.entities || [];
        const saved = (ents[idx] && ents[idx].temp_entity) || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
      // room humidity sensor pickers
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-room-hum]').forEach(p => {
        p.hass = this._hass;
        p.includeDomains = ['sensor'];
        const idx   = parseInt(p.dataset.roomHum);
        const ents  = this._config.entities || [];
        const saved = (ents[idx] && ents[idx].humidity_entity) || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
      // room power sensor pickers. This one was missing: the editor renders
      // data-room-power beside data-room-temp and data-room-hum, but only the
      // latter two had a branch here, so re-rendering the editor blanked the
      // power box while the value stayed saved and the card kept rendering it.
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-room-power]').forEach(p => {
        p.hass = this._hass;
        p.includeDomains = ['sensor'];
        const idx   = parseInt(p.dataset.roomPower);
        const ents  = this._config.entities || [];
        const saved = (ents[idx] && ents[idx].power_entity) || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
      // quick switch entity pickers -- same omission as the room power one.
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-qs]').forEach(p => {
        p.hass = this._hass;
        p.includeDomains = ['switch'];
        const idx  = parseInt(p.dataset.qs);
        const qIdx = parseInt(p.dataset.qsIdx);
        const ents = this._config.entities || [];
        const list  = (ents[idx] && ents[idx].quick_switches) || [];
        const entry = (typeof list[qIdx] === 'string') ? { entity_id: list[qIdx] } : (list[qIdx] || {});
        const saved = entry.entity_id || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
      // damper entity pickers
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-damper]').forEach(p => {
        p.hass = this._hass;
        p.includeDomains = ['cover'];
        const roomIdx   = parseInt(p.dataset.damper);
        const damperIdx = parseInt(p.dataset.damperIdx);
        const ents    = this._config.entities || [];
        const dampers = (ents[roomIdx] && ents[roomIdx].dampers) || [];
        const saved   = (dampers[damperIdx] && dampers[damperIdx].entity_id) || '';
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });
    };
    apply();
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  // ── Toggle an accordion without a full re-render (preserves picker state) ────────────
  _toggleSection(id) {
    this._open[id] = !this._open[id];
    const body  = this.shadowRoot.getElementById('body-' + id);
    const arrow = this.shadowRoot.getElementById('arrow-' + id);
    if (body) {
      body.style.display = this._open[id] ? 'block' : 'none';
      if (arrow) arrow.textContent = this._open[id] ? '▾' : '▸';
      if (this._open[id]) this._syncPickers();
    }
  }

  // ── Colour picker row (same as gate-card) ──────────────────────────────────────
  _colorRow(key, label) {
    const value  = this._config[key] || '#ffffff';
    const isOpen = this._picker === key;
    const swatches = ['#00ffcc','#00ff96','#ff5252','#00dcff','#ffd740','#ff8a65',
                      '#ffffff','#aaaaaa','#ffaa00','#22cc77','#2288ee','#ee4444'];
    return `
<div class="ci">
  <div class="ci-hdr" data-cp="${key}">
    <div class="ci-swatch" style="background:${value};"></div>
    <span class="ci-label">${label}</span>
    <code class="ci-code">${value}</code>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="ci-chv">
      <path d="${isOpen?'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z':'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'}"/>
    </svg>
  </div>
  ${isOpen ? `
  <div class="ci-body">
    <input type="color" data-cp-native="${key}" value="${value}" class="ci-native"/>
    <div class="ci-hex-wrap">
      <span class="ci-hash">#</span>
      <input type="text" data-cp-hex="${key}" value="${value.replace('#','')}" maxlength="6" placeholder="rrggbb" class="ci-hex-inp"/>
    </div>
    <div class="ci-swatches">
      ${swatches.map(c=>`<div data-cp-dot="${key}" data-color="${c}" class="ci-dot"
        style="background:${c};outline:${value===c?'2px solid var(--primary-color)':'2px solid transparent'};"></div>`).join('')}
    </div>
  </div>` : ''}
</div>`;
  }

  // ── Entity field uses the native ha-entity-picker ─────────────────────────────
  _entityField(key, label, domain) {
    return `
<div class="row">
  <label>${label}</label>
  <ha-entity-picker data-key="${key}" data-domain="${domain}" allow-custom-entity></ha-entity-picker>
</div>`;
  }

  _render() {
    const cfg  = this._config;
    const t    = this.t;
    const bgP  = cfg.background_preset || 'default';
    const lang = cfg.language || 'en';
    const roomCount = Math.max(1, Math.min(8, parseInt(cfg.room_count) || 4));
    const entities = (cfg.entities || []).slice();
    while (entities.length < roomCount) entities.push({});

    // ── Room rows (dynamic by room_count) ──────────────────────────────────
    let roomRows = '';
    for (let i = 0; i < roomCount; i++) {
      const ent   = entities[i] || {};
      const defLbl = (t.rooms && t.rooms[i]) || ('Room ' + (i+1));
      const defIco = (t.roomIcons && t.roomIcons[i]) || 'mdi:snowflake';
      roomRows += `
<div class="ac-row">
  <div class="ac-row-title">❄ ${t.edRooms.replace(/^❄\s*/,'')} ${i+1} – ${defLbl}</div>
  <div class="row">
    <label>${t.edAcEntity}</label>
    <ha-entity-picker data-room="${i}" data-domain="climate" allow-custom-entity></ha-entity-picker>
  </div>
  <div class="row">
    <label>${t.edRoomTempEntity || '🌡 Room temperature sensor'}</label>
    <ha-entity-picker data-room-temp="${i}" data-domain="sensor" allow-custom-entity></ha-entity-picker>
  </div>
  <div class="row">
    <label>${t.edRoomHumidityEntity || '💧 Room humidity sensor'}</label>
    <ha-entity-picker data-room-hum="${i}" data-domain="sensor" allow-custom-entity></ha-entity-picker>
  </div>
  <div class="row">
    <label>${t.edRoomPowerEntity || '⚡ Room power sensor (sensor.*)'}</label>
    <ha-entity-picker data-room-power="${i}" data-domain="sensor" allow-custom-entity></ha-entity-picker>
  </div>
  <div class="row">
    <label>${t.edAcName}</label>
    <input class="txt-inp" type="text" id="inp-room-label-${i}" placeholder="${defLbl}" value="${escHtml(ent.label||'')}"/>
  </div>
  <div class="row">
    <label>${t.edAcIcon}</label>
    <input class="txt-inp" type="text" id="inp-room-icon-${i}" placeholder="${defIco}" value="${escHtml(ent.icon||'')}"/>
  </div>
  <div class="row">
    <label>${t.edAcImage || '🖼 Room image (URL)'}</label>
    <div style="display:flex;gap:8px;align-items:center;">
      <input class="txt-inp" type="text" id="inp-room-image-${i}"
        placeholder="${t.edImagePlaceholder}"
        value="${escHtml(ent.image||'')}"
        style="flex:1;min-width:0;"/>
      ${ent.image ? `<div id="img-preview-${i}" style="width:48px;height:36px;border-radius:6px;overflow:hidden;flex-shrink:0;border:1px solid var(--divider-color);">
        <img src="${escUrl(ent.image)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.style.display='none'"/>
      </div>` : `<div id="img-preview-${i}" style="display:none"></div>`}
    </div>
  </div>
  <!-- ── Central AC toggle ── -->
  <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--divider-color);margin-top:4px;">
    <ha-icon icon="mdi:hvac" style="color:var(--primary-color);--mdi-icon-size:18px;flex-shrink:0;"></ha-icon>
    <div style="flex:1;min-width:0;">
      <div style="font-size:12px;font-weight:700;color:var(--primary-text-color);">${t.centralAcLabel || '🏢 Central AC'}</div>
      <div style="font-size:10px;color:var(--secondary-text-color);margin-top:1px;">${t.centralAcDesc || 'Enable to configure dampers'}</div>
    </div>
    <label style="position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0;">
      <input type="checkbox" id="tog-central-ac-${i}" ${ent.is_central_ac ? 'checked' : ''} style="opacity:0;width:0;height:0;position:absolute;">
      <span style="position:absolute;inset:0;border-radius:20px;cursor:pointer;transition:0.25s;background:${ent.is_central_ac ? 'var(--primary-color)' : 'rgba(0,0,0,0.18)'}"></span>
      <span style="position:absolute;top:2px;left:${ent.is_central_ac ? '18px' : '2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></span>
    </label>
  </div>
  <!-- ── Damper list (shown when central AC enabled) ── -->
  <div id="damper-section-${i}" style="display:${ent.is_central_ac ? 'block' : 'none'};margin-top:4px;">
    <div id="damper-list-${i}">
      ${(ent.dampers||[]).map((d,di) => `
      <div id="damper-row-${i}-${di}" style="display:flex;flex-direction:column;gap:6px;padding:8px;background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:8px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <span style="font-size:11px;font-weight:600;color:var(--primary-color);">${t.edDamperIndex}${di+1}</span>
          <button id="btn-del-damper-${i}-${di}" style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;border:1px solid var(--error-color,#f44);color:var(--error-color,#f44);background:transparent;cursor:pointer;">${t.damperRemove||'Remove'}</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--secondary-text-color);font-weight:600;">${t.damperEntity||'Damper entity (cover.*)'}</label>
          <ha-entity-picker data-damper="${i}" data-damper-idx="${di}" data-domain="cover" allow-custom-entity></ha-entity-picker>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--secondary-text-color);font-weight:600;">${t.damperName||'Damper name'}</label>
          <input class="txt-inp" type="text" id="inp-damper-name-${i}-${di}" placeholder="${t.edDamperNamePlaceholder}" value="${escHtml(d.name||'')}" style="font-size:12px;padding:6px 10px;"/>
        </div>
      </div>`).join('')}
    </div>
    <button id="btn-add-damper-${i}" style="width:100%;padding:7px;border-radius:8px;font-size:12px;font-weight:600;border:1.5px dashed var(--primary-color);color:var(--primary-color);background:rgba(3,169,244,0.06);cursor:pointer;margin-top:2px;">
      ${t.damperAdd||'+ Add damper'}
    </button>
  </div>

  <!-- ── Quick switches (per room) ── -->
  <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--divider-color);">
    <div style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--secondary-text-color);margin-bottom:6px;">
      ⚡ ${t.edQuickSwitchesTitle}
    </div>
    <div id="qs-list-${i}">
      ${(ent.quick_switches||[]).map((q,qi) => {
        const qid = (typeof q === 'string') ? q : ((q && (q.entity_id||q.switch||q.id)) || '');
        const qlb = (typeof q === 'string') ? '' : ((q && q.label) || '');
        return `
      <div id="qs-row-${i}-${qi}" style="display:flex;flex-direction:column;gap:6px;padding:8px;background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:8px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <span style="font-size:11px;font-weight:700;color:var(--primary-color);">#${qi+1}</span>
          <button id="btn-del-qs-${i}-${qi}" style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;border:1px solid var(--error-color,#f44);color:var(--error-color,#f44);background:transparent;cursor:pointer;">${t.qsRemove||'Remove'}</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--secondary-text-color);font-weight:600;">${t.qsEntity||'Switch entity (switch.*)'}</label>
          <ha-entity-picker data-qs="${i}" data-qs-idx="${qi}" data-domain="switch" allow-custom-entity></ha-entity-picker>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--secondary-text-color);font-weight:600;">${t.qsLabel||'Label (auto if blank)'}</label>
          <input class="txt-inp" type="text" id="inp-qs-label-${i}-${qi}" placeholder="${t.qsLabelPlaceholder}" value="${escHtml(qlb)}" style="font-size:12px;padding:6px 10px;"/>
        </div>
      </div>`;
      }).join('')}
    </div>
    <button id="btn-add-qs-${i}" style="width:100%;padding:7px;border-radius:8px;font-size:12px;font-weight:600;border:1.5px dashed var(--primary-color);color:var(--primary-color);background:rgba(3,169,244,0.06);cursor:pointer;">
      ${t.qsAdd||'+ Add quick switch'}
    </button>
  </div>
</div>`;
    }

    this.shadowRoot.innerHTML = `
<style>
  :host { display:block; font-family:var(--primary-font-family,'Roboto',sans-serif); }
  .editor { background:var(--card-background-color,#fff); color:var(--primary-text-color); }
  /* accordion */
  .acc-wrap { border-bottom:1px solid var(--divider-color); }
  .acc-head { display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;
              user-select:none;font-size:14px;font-weight:500;color:var(--primary-text-color);
              background:var(--secondary-background-color); }
  .acc-head:hover { filter:brightness(.96); }
  .acc-head ha-icon { color:var(--secondary-text-color);--mdi-icon-size:18px; }
  .acc-arrow { margin-left:auto;font-size:14px;color:var(--secondary-text-color); }
  .acc-body { padding:12px 14px;border-top:1px solid var(--divider-color);
              background:var(--card-background-color,#fff); }
  /* fields */
  .row { display:flex;flex-direction:column;margin-bottom:12px; }
  .row:last-child { margin-bottom:0; }
  .row label { font-size:12px;color:var(--secondary-text-color);margin-bottom:4px;font-weight:600; }
  ha-entity-picker { display:block;width:100%; }
  /* AC room rows */
  .ac-row { background:var(--secondary-background-color);border:1px solid var(--divider-color);
            border-radius:10px;padding:12px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px; }
  .ac-row:last-child { margin-bottom:0; }
  .ac-row-title { font-size:12px;font-weight:700;color:var(--primary-color);margin-bottom:2px; }
  /* text inputs */
  .txt-inp { background:var(--input-fill-color,rgba(0,0,0,.04));border:1px solid var(--divider-color);
             border-radius:8px;padding:8px 12px;font-size:13px;color:var(--primary-text-color);
             width:100%;box-sizing:border-box; }
  .txt-inp:focus { outline:none;border-color:var(--primary-color); }
  /* bg presets */
  .bg-grid { display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:10px; }
  .bgs { border-radius:7px;height:40px;cursor:pointer;border:2px solid transparent;
         display:flex;align-items:flex-end;padding:3px 5px;font-size:9px;font-family:monospace;
         color:rgba(255,255,255,.85);text-shadow:0 1px 3px rgba(0,0,0,.9);transition:border-color .15s;
         white-space:nowrap;overflow:hidden; }
  .bgs.on { border-color:var(--primary-color); }
  /* color picker */
  .ci { border:1px solid var(--divider-color);border-radius:8px;overflow:hidden;margin-bottom:8px; }
  .ci:last-child { margin-bottom:0; }
  .ci-hdr { display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;
            background:var(--card-background-color,#fff); }
  .ci-swatch { width:24px;height:24px;border-radius:4px;border:1px solid rgba(0,0,0,.1);flex-shrink:0; }
  .ci-label { font-size:13px;flex:1;color:var(--primary-text-color); }
  .ci-code { font-size:11px;color:var(--secondary-text-color);font-family:monospace;
             background:var(--secondary-background-color);padding:2px 6px;border-radius:3px; }
  .ci-chv { color:var(--secondary-text-color);flex-shrink:0; }
  .ci-body { padding:12px 14px;background:var(--secondary-background-color);
             border-top:1px solid var(--divider-color);display:flex;flex-direction:column;gap:10px; }
  .ci-native { width:100%;height:44px;border:1px solid var(--divider-color);border-radius:6px;
               cursor:pointer;padding:2px;background:transparent; }
  .ci-hex-wrap { display:flex;align-items:center;gap:6px;border:1px solid var(--divider-color);
                 border-radius:4px;padding:6px 10px;background:var(--card-background-color,#fff); }
  .ci-hash { color:var(--secondary-text-color);font-size:12px;font-family:monospace; }
  .ci-hex-inp { border:none;outline:none;width:100%;font-size:14px;
                color:var(--primary-text-color);font-family:monospace;background:transparent; }
  .ci-swatches { display:flex;gap:6px;flex-wrap:wrap; }
  .ci-dot { width:24px;height:24px;border-radius:50%;cursor:pointer;
            transition:transform .1s;outline-offset:2px; }
  .ci-dot:hover { transform:scale(1.15); }
</style>
<div class="editor">

  <!-- 0. Owner name — margin-top replaces the top padding of the removed header -->
  <div class="row" style="margin-top:12px;margin-bottom:4px;">
    <label style="font-size:12px;font-weight:600;color:var(--secondary-text-color);letter-spacing:.3px;">${t.edOwnerName}</label>
    <input id="inp-owner-name" type="text" placeholder="Smart Home"
      value="${escHtml(this._config.owner_name || '')}"
      style="width:100%;margin-top:6px;padding:8px 10px;border-radius:8px;
        border:1px solid var(--divider-color);background:var(--card-background-color,#fff);
        color:var(--primary-text-color);font-size:14px;font-family:inherit;box-sizing:border-box;outline:none;">
  </div>

  <!-- 1. View mode toggle -->
  <div class="acc-wrap">
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;">
      <ha-icon icon="mdi:view-split-vertical" style="color:var(--secondary-text-color);--mdi-icon-size:18px;"></ha-icon>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--primary-text-color);">${t.edViewMode}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button id="vm-full" style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:inherit;transition:all 0.15s;
          border:1px solid ${(this._config.view_mode||'full')==='full' ? 'var(--primary-color)' : 'var(--divider-color)'};
          background:${(this._config.view_mode||'full')==='full' ? 'var(--primary-color)' : 'transparent'};
          color:${(this._config.view_mode||'full')==='full' ? '#fff' : 'var(--secondary-text-color)'};">${t.edViewModeFull}</button>
        <button id="vm-lite" style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:inherit;transition:all 0.15s;
          border:1px solid ${(this._config.view_mode)==='lite' ? 'var(--primary-color)' : 'var(--divider-color)'};
          background:${(this._config.view_mode)==='lite' ? 'var(--primary-color)' : 'transparent'};
          color:${(this._config.view_mode)==='lite' ? '#fff' : 'var(--secondary-text-color)'};">${t.edViewModeLite}</button>
        <button id="vm-super-lite" style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:inherit;transition:all 0.15s;
          border:1px solid ${(this._config.view_mode)==='super_lite' ? 'var(--primary-color)' : 'var(--divider-color)'};
          background:${(this._config.view_mode)==='super_lite' ? 'var(--primary-color)' : 'transparent'};
          color:${(this._config.view_mode)==='super_lite' ? '#fff' : 'var(--secondary-text-color)'};">⚡ Super Lite</button>
      </div>
    </div>
  </div>

  <!-- 1-2. Popup style (Super Lite only) -->
  ${(this._config.view_mode) === 'super_lite' ? `
  <div class="acc-wrap">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--secondary-background-color);">
      <ha-icon icon="mdi:animation-play" style="color:var(--secondary-text-color);--mdi-icon-size:18px;"></ha-icon>
      <div style="flex:1;font-size:13px;font-weight:600;color:var(--primary-text-color);">${t.edPopupStyle || '✨ Popup style'}</div>
      <div style="display:flex;gap:6px;">
        <button id="ps-normal" style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:inherit;transition:all 0.15s;
          border:1px solid ${(this._config.popup_style||'normal')==='normal' ? 'var(--primary-color)' : 'var(--divider-color)'};
          background:${(this._config.popup_style||'normal')==='normal' ? 'var(--primary-color)' : 'transparent'};
          color:${(this._config.popup_style||'normal')==='normal' ? '#fff' : 'var(--secondary-text-color)'};">${t.edPopupNormal || 'Normal'}</button>
        <button id="ps-effect" style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:inherit;transition:all 0.15s;
          border:1px solid ${(this._config.popup_style)==='effect' ? 'var(--primary-color)' : 'var(--divider-color)'};
          background:${(this._config.popup_style)==='effect' ? 'var(--primary-color)' : 'transparent'};
          color:${(this._config.popup_style)==='effect' ? '#fff' : 'var(--secondary-text-color)'};">${t.edPopupEffect || 'Effect'}</button>
        <button id="ps-wave" style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:inherit;transition:all 0.15s;
          border:1px solid ${(this._config.popup_style)==='wave' ? 'var(--primary-color)' : 'var(--divider-color)'};
          background:${(this._config.popup_style)==='wave' ? 'var(--primary-color)' : 'transparent'};
          color:${(this._config.popup_style)==='wave' ? '#fff' : 'var(--secondary-text-color)'};">${t.edPopupWave || 'Wave'}</button>
      </div>
    </div>
  </div>

  <!-- 1-3. Fan/Swing in Super Lite (only shown in Super Lite) -->
  <div class="acc-wrap" style="margin-top:4px">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--secondary-background-color);">
      <ha-icon icon="mdi:fan" style="color:var(--secondary-text-color);--mdi-icon-size:18px;"></ha-icon>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--primary-text-color);">${t.edShowSlFan || '💨 Fan speed (Super Lite)'}</div>
        <div style="font-size:11px;color:var(--secondary-text-color);margin-top:2px">${t.edShowSlFanDesc || 'Show fan button in Super Lite'}</div>
      </div>
      <label style="position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0">
        <input type="checkbox" id="tog-show-sl-fan" ${this._config.show_sl_fan !== false ? 'checked' : ''} style="opacity:0;width:0;height:0;position:absolute">
        <span style="position:absolute;inset:0;border-radius:20px;cursor:pointer;transition:0.25s;background:${this._config.show_sl_fan !== false ? 'var(--primary-color)' : 'rgba(0,0,0,0.18)'}"></span>
        <span style="position:absolute;top:2px;left:${this._config.show_sl_fan !== false ? '18px' : '2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></span>
      </label>
    </div>
  </div>
  <div class="acc-wrap" style="margin-top:4px">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--secondary-background-color);">
      <ha-icon icon="mdi:arrow-oscillating" style="color:var(--secondary-text-color);--mdi-icon-size:18px;"></ha-icon>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--primary-text-color);">${t.edShowSlSwing || '🔄 Airflow (Super Lite)'}</div>
        <div style="font-size:11px;color:var(--secondary-text-color);margin-top:2px">${t.edShowSlSwingDesc || 'Show airflow button in Super Lite'}</div>
      </div>
      <label style="position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0">
        <input type="checkbox" id="tog-show-sl-swing" ${this._config.show_sl_swing !== false ? 'checked' : ''} style="opacity:0;width:0;height:0;position:absolute">
        <span style="position:absolute;inset:0;border-radius:20px;cursor:pointer;transition:0.25s;background:${this._config.show_sl_swing !== false ? 'var(--primary-color)' : 'rgba(0,0,0,0.18)'}"></span>
        <span style="position:absolute;top:2px;left:${this._config.show_sl_swing !== false ? '18px' : '2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></span>
      </label>
    </div>
  </div>` : ''}

  <!-- 2. Display Options accordion -->
  <div class="acc-wrap">
    <div class="acc-head" id="head-display">
      <ha-icon icon="mdi:eye-settings-outline"></ha-icon> ${t.edDisplay}
      <span class="acc-arrow" id="arrow-display">${this._open.display?'▾':'▸'}</span>
    </div>
    <div class="acc-body" id="body-display" style="display:${this._open.display?'block':'none'}">
      ${[
        ['show_greet',        t.edShowGreet,       t.edShowGreetDesc],
        null,
        ['show_cool',         t.edShowCool,        ''],
        ['show_heat',         t.edShowHeat,        ''],
        ['show_dry',          t.edShowDry,         ''],
        ['show_fan_only',     t.edShowFanOnly,     ''],
        ['show_auto',         t.edShowAuto || '🔄 Auto mode', ''],
        null,
        ['show_fan',          t.edShowFan,         t.edShowFanDesc],
        ['show_swing',        t.edShowSwing,       t.edShowSwingDesc],
        ['show_hswing',       t.edShowHswing,      t.edShowHswingDesc],
        ['show_quick_switches', t.edShowQuickSwitches, t.edShowQuickSwitchesDesc],
        ['show_preset_bar',   t.edShowPreset,      t.edShowPresetDesc],
        null,
        ['show_status',       t.edShowStatus,      t.edShowStatusDesc],
        ['show_outdoor_temp', t.edShowOutdoorTemp, ''],
        ['show_humidity',     t.edShowHumidity,    ''],
    ['show_pm25',         t.edShowPm25,        ''],
        ['show_power',        t.edShowPower,       t.edShowPowerDesc],
        null,
        ['show_all_off',      t.edShowAllOff,      t.edShowAllOffDesc],
        ['show_timer',        t.edShowTimer,        t.edShowTimerDesc],
        null,
        ['show_room_env',     t.edShowRoomEnv,      t.edShowRoomEnvDesc],
        null,
        ['dial_invert',       t.edDialInvert||'🔄 Swap dial rings', t.edDialInvertDesc||'Set-temp outer (haptic drag), room-temp inner — default'],
      ].map(item => {
        if (!item) return '<div style="height:1px;background:var(--divider-color,rgba(0,0,0,0.08));margin:4px 0;"></div>';
        const [key, label, desc] = item;
        const checked = this._config[key] !== false;
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 2px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:12.5px;font-weight:500;color:var(--primary-text-color);">${label}</div>
            ${desc ? `<div style="font-size:10.5px;color:var(--secondary-text-color);margin-top:1px;">${desc}</div>` : ''}
          </div>
          <label style="position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0;margin:0;">
            <input type="checkbox" class="disp-tog" data-key="${key}" ${checked ? 'checked' : ''}
              style="opacity:0;width:0;height:0;position:absolute;">
            <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;
              background:${checked ? 'var(--primary-color,#03a9f4)' : 'rgba(0,0,0,0.2)'};
              border-radius:20px;transition:background 0.2s;border:1px solid var(--divider-color);">
              <span style="position:absolute;height:14px;width:14px;border-radius:50%;background:#fff;
                top:2px;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);
                left:${checked ? '19px' : '2px'};"></span>
            </span>
          </label>
        </div>`;
      }).join('')}

      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--divider-color);">
        <div style="font-size:11.5px;font-weight:700;color:var(--secondary-text-color);margin-bottom:6px;">${t.edChipsHeader}</div>
        ${[0, 1, 2].map((ci) => {
          const ch = ((cfg.preset_chips || [])[ci]) || {};
          return '<div class="ac-row" style="padding:9px;margin-bottom:8px;">'
            + '<div style="font-size:10px;font-weight:700;color:var(--secondary-text-color);margin-bottom:4px;">'
            + (ci + 1) + '. ' + t.edChipEntity + '</div>'
            + '<ha-entity-picker data-chip="' + ci + '" value="' + escHtml(ch.entity_id || '') + '" allow-custom-entity'
            + ' style="display:block;width:100%;"></ha-entity-picker>'
            + '<input class="txt-inp" type="text" data-chip-label="' + ci + '" placeholder="' + t.edChipLabel + '"'
            + ' value="' + escHtml(ch.label || '') + '" style="font-size:12px;padding:6px 10px;">'
            + '<input class="txt-inp" type="text" data-chip-option="' + ci + '" placeholder="' + t.edChipOption + '"'
            + ' value="' + escHtml(ch.option || '') + '" style="font-size:12px;padding:6px 10px;">'
            + '</div>';
        }).join('')}
      </div>

      <div style="margin-top:10px;padding:8px 2px;display:flex;align-items:center;gap:10px;">
        <div style="flex:1;font-size:12.5px;font-weight:500;color:var(--primary-text-color);">${t.edPowerUnit || '⚡ Power unit'}</div>
        <select id="sel-power-unit" style="background:var(--secondary-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;">
          <option value="kw" ${(this._config.power_unit||'kw')==='kw'?'selected':''}>${t.edPowerUnitKw||'kW'}</option>
          <option value="w"  ${(this._config.power_unit||'kw')==='w' ?'selected':''}>${t.edPowerUnitW ||'W' }</option>
        </select>
      </div>
      <div style="margin-top:8px;padding:8px 2px;display:flex;align-items:center;gap:10px;">
        <div style="flex:1;font-size:12.5px;font-weight:500;color:var(--primary-text-color);">${t.edTempUnit||'🌡 Temperature unit'}</div>
        <div style="display:flex;gap:4px;">
          <button id="tu-c" style="padding:4px 12px;border-radius:8px;border:1px solid ${(this._config.temp_unit||'C')==='C'?'var(--primary-color,#03a9f4)':'var(--divider-color)'};background:${(this._config.temp_unit||'C')==='C'?'rgba(3,169,244,0.15)':'transparent'};color:${(this._config.temp_unit||'C')==='C'?'var(--primary-color,#03a9f4)':'var(--secondary-text-color)'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;">°C</button>
          <button id="tu-f" style="padding:4px 12px;border-radius:8px;border:1px solid ${(this._config.temp_unit||'C')==='F'?'var(--primary-color,#03a9f4)':'var(--divider-color)'};background:${(this._config.temp_unit||'C')==='F'?'rgba(3,169,244,0.15)':'transparent'};color:${(this._config.temp_unit||'C')==='F'?'var(--primary-color,#03a9f4)':'var(--secondary-text-color)'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;">°F</button>
        </div>
      </div>
      <div style="height:1px;background:var(--divider-color,rgba(0,0,0,0.08));margin:6px 0;"></div>
      <div style="padding:8px 2px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div>
            <div style="font-size:12.5px;font-weight:500;color:var(--primary-text-color);">${t.edCoolAnimSpeed||'❄ Snowflake repeat (s)'}</div>
            <div style="font-size:10.5px;color:var(--secondary-text-color);margin-top:1px;">${t.edCoolAnimSpeedDesc||'Wait between animations (2–15s)'}</div>
          </div>
          <span id="cool-anim-speed-val" style="font-size:13px;font-weight:700;color:var(--primary-color,#03a9f4);min-width:28px;text-align:right;">${Math.round((this._config.cool_anim_speed||10000)/1000)}s</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:10px;color:var(--secondary-text-color);">2s</span>
          <input type="range" id="inp-cool-anim-speed" min="2000" max="15000" step="500"
            value="${this._config.cool_anim_speed||10000}"
            style="flex:1;accent-color:var(--primary-color,#03a9f4);height:4px;cursor:pointer;">
          <span style="font-size:10px;color:var(--secondary-text-color);">15s</span>
        </div>
      </div>
    </div>
  </div>
  <div class="acc-wrap">
    <div class="acc-head" id="head-roomcount">
      <ha-icon icon="mdi:home-group"></ha-icon> ${t.edRoomsHeader(roomCount)}
      <span class="acc-arrow" id="arrow-roomcount">${this._open.roomcount?'▾':'▸'}</span>
    </div>
    <div class="acc-body" id="body-roomcount" style="display:${this._open.roomcount?'block':'none'}">
      <div class="row">
        <label style="margin-bottom:8px;">${t.edRoomCountLabel(roomCount)}</label>
        <div style="display:flex;align-items:center;gap:12px;">
          <input type="range" id="inp-room-count" min="1" max="8" step="1" value="${roomCount}"
            style="flex:1;height:4px;cursor:pointer;accent-color:var(--primary-color);">
          <span id="room-count-display" style="min-width:24px;font-weight:700;font-size:16px;color:var(--primary-color);">${roomCount}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--secondary-text-color);margin-top:4px;">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Rooms -->
  <div class="acc-wrap">
    <div class="acc-head" id="head-rooms">
      <ha-icon icon="mdi:air-conditioner"></ha-icon> ${t.edRoomsHeader(roomCount)}
      <span class="acc-arrow" id="arrow-rooms">${this._open.rooms?'▾':'▸'}</span>
    </div>
    <div class="acc-body" id="body-rooms" style="display:${this._open.rooms?'block':'none'}">
      ${roomRows}
    </div>
  </div>

  <!-- 4. Sensors -->
  <div class="acc-wrap">
    <div class="acc-head" id="head-sensors">
      <ha-icon icon="mdi:broadcast"></ha-icon> ${t.edSensors}
      <span class="acc-arrow" id="arrow-sensors">${this._open.sensors?'▾':'▸'}</span>
    </div>
    <div class="acc-body" id="body-sensors" style="display:${this._open.sensors?'block':'none'}">
      ${this._entityField('pm25_entity',              t.edPm25,           'sensor')}
      ${this._entityField('outdoor_temp_entity',      t.edOutdoorTemp,    'sensor')}
      ${this._entityField('outdoor_humidity_entity',  t.edOutdoorHumidity,'sensor')}
      ${this._entityField('power_entity',             t.edPower,          'sensor')}
      <div style="font-size:10.5px;line-height:1.55;color:var(--secondary-text-color);margin:2px 0 6px;">${t.sensRowDesc}</div>
    </div>
  </div>

  <!-- 5. Background -->
  <div class="acc-wrap">
    <div class="acc-head" id="head-bg">
      <ha-icon icon="mdi:palette"></ha-icon> ${t.edBg}
      <span class="acc-arrow" id="arrow-bg">${this._open.bg?'▾':'▸'}</span>
    </div>
    <div class="acc-body" id="body-bg" style="display:${this._open.bg?'block':'none'}">
      <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin-bottom:8px;letter-spacing:.4px;">${t.bgPresets}</div>
      <div class="bg-grid">
        ${AC_BG_PRESETS.map(p => {
          const c1 = p.c1||'#888', c2 = p.c2||'#444';
          const isC = p.id === 'custom';
          return `<div class="bgs ${bgP===p.id?'on':''}" data-bg="${p.id}"
            style="${isC?'background:linear-gradient(135deg,#e0e0e0,#bdbdbd);color:#555;text-shadow:none;':'background:linear-gradient(135deg,'+c1+'bb 0%,'+c2+'44 100%);'}">${(t && t.bgPresetNames && t.bgPresetNames[p.id]) || p.label}</div>`;
        }).join('')}
      </div>
      ${bgP === 'custom' ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${this._colorRow('bg_color1', t.color1)}
        ${this._colorRow('bg_color2', t.color2)}
      </div>` : ''}

      <!-- Opacity slider -->
      <div style="margin-top:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--secondary-text-color);">
            ${t.edBgAlpha||'🔆 Background opacity'}
          </span>
          <span id="bg-alpha-val-lbl" style="font-size:13px;font-weight:700;color:var(--primary-color);min-width:36px;text-align:right;">
            ${cfg.bg_alpha !== undefined ? cfg.bg_alpha : 80}%
          </span>
        </div>
        <input type="range" id="inp-bg-alpha" min="0" max="100" step="1"
          value="${cfg.bg_alpha !== undefined ? cfg.bg_alpha : 80}"
          style="width:100%;height:4px;cursor:pointer;accent-color:var(--primary-color);">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--secondary-text-color);margin-top:3px;">
          <span>0% (${t.edBgTransparent||'Transparent'})</span><span>100% (${t.edBgSolid||'Solid'})</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 5b. Advanced colors -->
  <div class="acc-wrap">
    <div class="acc-head" id="head-colors">
      <ha-icon icon="mdi:palette-swatch"></ha-icon> ${t.edColorsAdvanced||'🎨 Advanced colors'}
      <span class="acc-arrow" id="arrow-colors">${this._open.colors?'▾':'▸'}</span>
    </div>
    <div class="acc-body" id="body-colors" style="display:${this._open.colors?'block':'none'}">
      <div style="font-size:11px;color:var(--secondary-text-color);margin-bottom:10px;line-height:1.5;">
        ${t.edColorsDefault||'Leave blank = use default color. Applied in real time.'}
      </div>

      <div style="font-size:10px;font-weight:700;color:var(--secondary-text-color);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid var(--divider-color);">${t.edColorsSecHeader||'📌 Header & Greeting'}</div>
      ${this._colorRow('color_title', t.colorLabels.color_title)}
      ${this._colorRow('color_greet_sub', t.colorLabels.color_greet_sub)}
      ${this._colorRow('color_greet_name', t.colorLabels.color_greet_name)}

      <div style="font-size:10px;font-weight:700;color:var(--secondary-text-color);letter-spacing:.5px;margin:14px 0 6px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid var(--divider-color);">${t.edColorsDial||'🌡 Temperature dial'}</div>
      ${this._colorRow('color_dial_lbl', t.colorLabels.color_dial_lbl)}
      ${this._colorRow('color_temp_val', t.colorLabels.color_temp_val)}
      ${this._colorRow('color_comfort', t.colorLabels.color_comfort)}
      ${this._colorRow('color_temp_set', t.colorLabels.color_temp_set)}
      ${this._colorRow('color_eta', t.colorLabels.color_eta)}
      ${this._colorRow('color_dial_arc', t.colorLabels.color_dial_arc)}

      <div style="font-size:10px;font-weight:700;color:var(--secondary-text-color);letter-spacing:.5px;margin:14px 0 6px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid var(--divider-color);">${t.edColorsModeCtrl||'⚡ Modes & Controls'}</div>
      ${this._colorRow('color_mode_lbl', t.colorLabels.color_mode_lbl)}
      ${this._colorRow('color_mode_active', t.colorLabels.color_mode_active)}
      ${this._colorRow('color_fc_label', t.colorLabels.color_fc_label)}
      ${this._colorRow('color_fc_val', t.colorLabels.color_fc_val)}
      ${this._colorRow('color_swing_lbl', t.colorLabels.color_swing_lbl)}
      ${this._colorRow('color_power_lbl', t.colorLabels.color_power_lbl)}
      ${this._colorRow('color_timer_lbl', t.colorLabels.color_timer_lbl)}
      ${this._colorRow('color_alloff_lbl', t.colorLabels.color_alloff_lbl)}

      <div style="font-size:10px;font-weight:700;color:var(--secondary-text-color);letter-spacing:.5px;margin:14px 0 6px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid var(--divider-color);">${t.edColorsStatusRoom||'🏠 Status & Room tabs'}</div>
      ${this._colorRow('color_st_title', t.colorLabels.color_st_title)}
      ${this._colorRow('color_status_on', t.colorLabels.color_status_on)}
      ${this._colorRow('color_status_off', t.colorLabels.color_status_off)}
      ${this._colorRow('color_st_sub', t.colorLabels.color_st_sub)}
      ${this._colorRow('color_room_header', t.colorLabels.color_room_header)}
      ${this._colorRow('color_room_name', t.colorLabels.color_room_name)}
      ${this._colorRow('color_room_on', t.colorLabels.color_room_on)}
      ${this._colorRow('color_room_off', t.colorLabels.color_room_off)}
      ${this._colorRow('color_fan_bar', t.colorLabels.color_fan_bar)}

      <div style="margin-top:14px;padding:8px 10px;background:var(--secondary-background-color);border-radius:8px;border:1px solid var(--divider-color);">
        <button id="btn-reset-colors" style="width:100%;padding:8px;border-radius:7px;border:1px solid var(--divider-color);background:transparent;color:var(--secondary-text-color);font-size:12px;cursor:pointer;font-family:inherit;">
          ${t.edColorsReset||'↩ Reset all colors to default'}
        </button>
      </div>
    </div>
  </div>
</div>`;

    this._bindEvents();
    this._syncPickers();
  }

  _bindEvents() {
    const sr = this.shadowRoot;

    // accordion
    ['roomcount','rooms','sensors','bg','display','colors'].forEach(id => {
      const hdr = sr.getElementById('head-' + id);
      if (hdr) hdr.addEventListener('click', () => this._toggleSection(id));
    });

    // bg preset tiles
    sr.querySelectorAll('[data-bg]').forEach(tile =>
      tile.addEventListener('click', () => {
        this._config = { ...this._config, background_preset: tile.dataset.bg };
        this._fire();
        this._render();
      }));

    // color picker header toggle
    sr.querySelectorAll('[data-cp]').forEach(hdr =>
      hdr.addEventListener('click', () => {
        const k = hdr.dataset.cp;
        this._picker = this._picker === k ? null : k;
        this._render();
      }));

    // native color input
    sr.querySelectorAll('[data-cp-native]').forEach(inp => {
      inp.addEventListener('input', () => {
        const ci   = inp.closest('.ci');
        const sw   = ci ? ci.querySelector('.ci-swatch') : null;
        const code = ci ? ci.querySelector('.ci-code') : null;
        const hex  = sr.querySelector(`[data-cp-hex="${inp.dataset.cpNative}"]`);
        if (sw)   sw.style.background = inp.value;
        if (code) code.textContent    = inp.value;
        if (hex)  hex.value           = inp.value.replace('#','');
        this._config[inp.dataset.cpNative] = inp.value;
        this._fire();
      });
      inp.addEventListener('change', () => {
        this._config[inp.dataset.cpNative] = inp.value;
        this._fire();
        this._render();
      });
    });

    // hex text input
    sr.querySelectorAll('[data-cp-hex]').forEach(inp =>
      inp.addEventListener('change', () => {
        const val = '#' + inp.value.replace('#','');
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          this._config[inp.dataset.cpHex] = val;
          this._fire();
          this._render();
        }
      }));

    // swatch dot
    sr.querySelectorAll('[data-cp-dot]').forEach(dot =>
      dot.addEventListener('click', () => {
        this._config[dot.dataset.cpDot] = dot.dataset.color;
        this._fire();
        this._render();
      }));

    // room count slider
    const rcSlider = sr.getElementById('inp-room-count');
    const rcDisplay = sr.getElementById('room-count-display');
    if (rcSlider) {
      rcSlider.addEventListener('input', () => {
        const val = parseInt(rcSlider.value);
        if (rcDisplay) rcDisplay.textContent = val;
        // update accordion header live
        const hdrRoomcount = sr.getElementById('head-roomcount');
        const hdrRooms = sr.getElementById('head-rooms');
        const t2 = this.t;
        if (hdrRoomcount) {
          const arr = sr.getElementById('arrow-roomcount');
          hdrRoomcount.innerHTML = `<ha-icon icon="mdi:home-group"></ha-icon> ${t2.edRoomsHeader(val)}<span class="acc-arrow" id="arrow-roomcount">${arr ? arr.textContent : '▸'}</span>`;
        }
        if (hdrRooms) {
          const arr2 = sr.getElementById('arrow-rooms');
          hdrRooms.innerHTML = `<ha-icon icon="mdi:air-conditioner"></ha-icon> ${t2.edRoomsHeader(val)}<span class="acc-arrow" id="arrow-rooms">${arr2 ? arr2.textContent : '▸'}</span>`;
        }
      });
      rcSlider.addEventListener('change', () => {
        const val = parseInt(rcSlider.value);
        this._config = { ...this._config, room_count: val };
        this._fire();
        this._render();
      });
    }

    // wireTextInput — update state on every keystroke, fire only on blur/Enter (keeps focus)
    const wireTextInput = (el, updater) => {
      if (!el) return;
      el.addEventListener('input',  () => updater(el.value));
      el.addEventListener('change', () => { updater(el.value); this._fire(); });
      el.addEventListener('blur',   () => { updater(el.value); this._fire(); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); });
    };

    // Owner name input
    wireTextInput(sr.getElementById('inp-owner-name'), val => {
      this._config = { ...this._config, owner_name: val };
    });

    // Room label + icon + image inputs
    const roomCountBind = Math.max(1, Math.min(8, parseInt(this._config.room_count) || 4));
    for (let i = 0; i < roomCountBind; i++) {
      const lblEl   = sr.getElementById('inp-room-label-' + i);
      const iconEl  = sr.getElementById('inp-room-icon-'  + i);
      const imageEl = sr.getElementById('inp-room-image-' + i);
      wireTextInput(lblEl, val => {
        const ents = (this._config.entities || []).slice();
        while (ents.length <= i) ents.push({});
        ents[i] = { ...ents[i], label: val };
        this._config = { ...this._config, entities: ents };
      });
      wireTextInput(iconEl, val => {
        const ents = (this._config.entities || []).slice();
        while (ents.length <= i) ents.push({});
        ents[i] = { ...ents[i], icon: val };
        this._config = { ...this._config, entities: ents };
      });
      // Image input — live preview update
      if (imageEl) {
        imageEl.addEventListener('input', () => {
          const ents = (this._config.entities || []).slice();
          while (ents.length <= i) ents.push({});
          ents[i] = { ...ents[i], image: imageEl.value };
          this._config = { ...this._config, entities: ents };
          // Live preview
          const prev = sr.getElementById('img-preview-' + i);
          if (prev) {
            if (imageEl.value) {
              prev.style.display = '';
              prev.innerHTML = `<img src="${escUrl(imageEl.value)}" style="width:100%;height:100%;object-fit:cover;border-radius:5px;" onerror="this.parentNode.style.display='none'"/>`;
            } else {
              prev.style.display = 'none';
            }
          }
        });
        imageEl.addEventListener('change', () => { this._fire(); });
        imageEl.addEventListener('blur',   () => { this._fire(); });
        imageEl.addEventListener('keydown', e => { if (e.key === 'Enter') imageEl.blur(); });
      }
    }

    // ha-entity-picker: room entities
    sr.querySelectorAll('ha-entity-picker[data-room]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const idx  = parseInt(picker.dataset.room);
        const val  = e.detail.value;
        const rcMax = Math.max(1, Math.min(8, parseInt(this._config.room_count) || 4));
        const ents = (this._config.entities || []).slice();
        while (ents.length <= idx) ents.push({});
        if (val) ents[idx] = { ...ents[idx], entity_id: val };
        else delete ents[idx].entity_id;
        this._config = { ...this._config, entities: ents };
        this._fire();
      }));

    // ha-entity-picker: room temp sensor
    sr.querySelectorAll('ha-entity-picker[data-room-temp]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const idx = parseInt(picker.dataset.roomTemp);
        const val = e.detail.value;
        const ents = (this._config.entities || []).slice();
        while (ents.length <= idx) ents.push({});
        if (val) ents[idx] = { ...ents[idx], temp_entity: val };
        else delete ents[idx].temp_entity;
        this._config = { ...this._config, entities: ents };
        this._fire();
      }));

    // ha-entity-picker: room humidity sensor
    sr.querySelectorAll('ha-entity-picker[data-room-hum]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const idx = parseInt(picker.dataset.roomHum);
        const val = e.detail.value;
        const ents = (this._config.entities || []).slice();
        while (ents.length <= idx) ents.push({});
        if (val) ents[idx] = { ...ents[idx], humidity_entity: val };
        else delete ents[idx].humidity_entity;
        this._config = { ...this._config, entities: ents };
        this._fire();
      }));

    // ha-entity-picker: room power sensor
    sr.querySelectorAll('ha-entity-picker[data-room-power]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const idx = parseInt(picker.dataset.roomPower);
        const val = e.detail.value;
        const ents = (this._config.entities || []).slice();
        while (ents.length <= idx) ents.push({});
        if (val) ents[idx] = { ...ents[idx], power_entity: val };
        else delete ents[idx].power_entity;
        this._config = { ...this._config, entities: ents };
        this._fire();
      }));

    // ── Central AC: toggle is_central_ac per room ─────────────────────────────
    const roomCountForDamper = Math.max(1, Math.min(8, parseInt(this._config.room_count) || 4));
    for (let i = 0; i < roomCountForDamper; i++) {
      const togCA = sr.getElementById('tog-central-ac-' + i);
      if (togCA) {
        togCA.addEventListener('change', () => {
          const ents = (this._config.entities || []).slice();
          while (ents.length <= i) ents.push({});
          ents[i] = { ...ents[i], is_central_ac: togCA.checked };
          if (!togCA.checked) { ents[i] = { ...ents[i], dampers: [] }; }
          this._config = { ...this._config, entities: ents };
          this._fire();
          // Show/hide damper section without full re-render
          const sec = sr.getElementById('damper-section-' + i);
          if (sec) sec.style.display = togCA.checked ? 'block' : 'none';
          // Update toggle knob + track color
          const knob = togCA.nextElementSibling && togCA.nextElementSibling.nextElementSibling;
          const track = togCA.nextElementSibling;
          if (track) track.style.background = togCA.checked ? 'var(--primary-color)' : 'rgba(0,0,0,0.18)';
          if (knob)  knob.style.left = togCA.checked ? '18px' : '2px';
        });
      }

      // ── Quick switches: add / remove / pick / label ─────────────────────────
      const qsOf = (idx) => {
        const ents = this._config.entities || [];
        const room = ents[idx] || {};
        return (room.quick_switches || []).slice();
      };
      const writeQs = (idx, list) => {
        const ents = (this._config.entities || []).slice();
        while (ents.length <= idx) ents.push({});
        ents[idx] = { ...ents[idx], quick_switches: list };
        this._config = { ...this._config, entities: ents };
        this._fire();
        this._render();
      };

      const btnAddQs = sr.getElementById('btn-add-qs-' + i);
      if (btnAddQs) {
        btnAddQs.addEventListener('click', () => {
          const list = qsOf(i);
          list.push({ entity_id: '', label: '' });
          writeQs(i, list);
        });
      }

      // Shadow-root locals are per class: the card binds it as `r`, the editor
      // binds it as `sr`. Using the other class's name is a ReferenceError
      // that only shows up when this editor actually mounts.
      const qsRows = sr.querySelectorAll('[data-qs-idx]');
      qsRows.forEach((pk) => {
        const qi = parseInt(pk.dataset.qsIdx, 10);
        pk.addEventListener('value-changed', () => {
          const list = qsOf(i);
          if (!list[qi]) return;
          const val = pk.value || '';
          if (val) list[qi] = { ...list[qi], entity_id: val };
          else list[qi] = { ...list[qi], entity_id: '' };
          this._config = { ...this._config, entities: (this._config.entities || []).map((e, x) => x === i ? { ...e, quick_switches: list } : e) };
          this._fire();
        });
      });

      const delQs = sr.querySelectorAll('[id^="btn-del-qs-"]');
      delQs.forEach((btn) => {
        const parts = btn.id.split('-');           // btn-del-qs-<room>-<idx>
        const qi = parseInt(parts[parts.length - 1], 10);
        btn.addEventListener('click', () => {
          const list = qsOf(i);
          list.splice(qi, 1);
          writeQs(i, list);
        });
      });

      const qsLabels = sr.querySelectorAll('[id^="inp-qs-label-"]');
      qsLabels.forEach((inp) => {
        const parts = inp.id.split('-');            // inp-qs-label-<room>-<idx>
        const qi = parseInt(parts[parts.length - 1], 10);
        inp.addEventListener('input', () => {
          const list = qsOf(i);
          if (!list[qi]) return;
          const cur = (typeof list[qi] === 'string') ? { entity_id: list[qi], label: '' } : { ...list[qi] };
          cur.label = inp.value;
          list[qi] = cur;
          const ents = (this._config.entities || []).slice();
          ents[i] = { ...ents[i], quick_switches: list };
          this._config = { ...this._config, entities: ents };
        });
        inp.addEventListener('blur', () => { this._fire(); });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
      });

      // ── Add damper button ───────────────────────────────────────────────────
      const btnAddDamper = sr.getElementById('btn-add-damper-' + i);
      if (btnAddDamper) {
        btnAddDamper.addEventListener('click', () => {
          const ents = (this._config.entities || []).slice();
          while (ents.length <= i) ents.push({});
          const dampers = ((ents[i] && ents[i].dampers) || []).slice();
          dampers.push({ entity_id: '', name: '' });
          ents[i] = { ...ents[i], dampers };
          this._config = { ...this._config, entities: ents };
          this._fire();
          this._render();
        });
      }

      // ── Delete damper buttons ───────────────────────────────────────────────
      const ents0 = (this._config.entities || []);
      const dampers0 = ((ents0[i] && ents0[i].dampers) || []);
      for (let di = 0; di < dampers0.length; di++) {
        const btnDel = sr.getElementById('btn-del-damper-' + i + '-' + di);
        if (btnDel) {
          btnDel.addEventListener('click', () => {
            const ents2 = (this._config.entities || []).slice();
            while (ents2.length <= i) ents2.push({});
            const dmps = ((ents2[i] && ents2[i].dampers) || []).slice();
            dmps.splice(di, 1);
            ents2[i] = { ...ents2[i], dampers: dmps };
            this._config = { ...this._config, entities: ents2 };
            this._fire();
            this._render();
          });
        }
        // Damper name input
        const nameEl = sr.getElementById('inp-damper-name-' + i + '-' + di);
        if (nameEl) {
          nameEl.addEventListener('input', () => {
            const ents3 = (this._config.entities || []).slice();
            while (ents3.length <= i) ents3.push({});
            const dmps3 = ((ents3[i] && ents3[i].dampers) || []).slice();
            while (dmps3.length <= di) dmps3.push({});
            dmps3[di] = { ...dmps3[di], name: nameEl.value };
            ents3[i] = { ...ents3[i], dampers: dmps3 };
            this._config = { ...this._config, entities: ents3 };
          });
          nameEl.addEventListener('blur', () => { this._fire(); });
          nameEl.addEventListener('keydown', e => { if (e.key === 'Enter') nameEl.blur(); });
        }
      }
    }

    // ha-entity-picker: damper entity
    sr.querySelectorAll('ha-entity-picker[data-damper]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const roomIdx   = parseInt(picker.dataset.damper);
        const damperIdx = parseInt(picker.dataset.damperIdx);
        const val = e.detail.value;
        const ents = (this._config.entities || []).slice();
        while (ents.length <= roomIdx) ents.push({});
        const dmps = ((ents[roomIdx] && ents[roomIdx].dampers) || []).slice();
        while (dmps.length <= damperIdx) dmps.push({});
        if (val) dmps[damperIdx] = { ...dmps[damperIdx], entity_id: val };
        else delete dmps[damperIdx].entity_id;
        ents[roomIdx] = { ...ents[roomIdx], dampers: dmps };
        this._config = { ...this._config, entities: ents };
        this._fire();
      }));

    // quick action chips: entity + option + label, three rows
    const chipOf = (i) => {
      const list = (this._config.preset_chips || []).slice();
      while (list.length <= i) list.push({});
      return list;
    };
    const writeChip = (i, patch) => {
      const list = chipOf(i);
      list[i] = { ...list[i], ...patch };
      if (!list[i].entity_id) delete list[i].entity_id;
      this._config = { ...this._config, preset_chips: list.filter((c) => c && c.entity_id) };
      this._fire();
    };
    sr.querySelectorAll('ha-entity-picker[data-chip]').forEach(p =>
      p.addEventListener('value-changed', (e) => {
        const v = e.detail.value;
        writeChip(parseInt(p.dataset.chip, 10), { entity_id: v || '' });
        if (!v) this._render();
      }));
    sr.querySelectorAll('input[data-chip-label]').forEach(inp => {
      const i = parseInt(inp.dataset.chipLabel, 10);
      const upd = () => writeChip(i, { label: inp.value });
      inp.addEventListener('input', upd);
      inp.addEventListener('blur', () => { upd(); this._fire(); });
    });
    sr.querySelectorAll('input[data-chip-option]').forEach(inp => {
      const i = parseInt(inp.dataset.chipOption, 10);
      const upd = () => writeChip(i, { option: inp.value });
      inp.addEventListener('input', upd);
      inp.addEventListener('blur', () => { upd(); this._fire(); });
    });

    // power unit select
    const selPowerUnit = sr.getElementById('sel-power-unit');
    if (selPowerUnit) selPowerUnit.addEventListener('change', () => {
      this._config = { ...this._config, power_unit: selPowerUnit.value };
      this._fire(); this._render();
    });

    // temperature unit toggle (°C / °F)
    const tuC = sr.getElementById('tu-c');
    const tuF = sr.getElementById('tu-f');
    if (tuC) tuC.addEventListener('click', () => {
      this._config = { ...this._config, temp_unit: 'C' };
      this._fire(); this._render();
    });
    if (tuF) tuF.addEventListener('click', () => {
      this._config = { ...this._config, temp_unit: 'F' };
      this._fire(); this._render();
    });

    // cool anim speed slider
    const sliderCoolSpeed = sr.getElementById('inp-cool-anim-speed');
    if (sliderCoolSpeed) {
      // Helper: find sibling card elements inside the same hui-card-element and restart the animation
      const _restartCardAnim = (val) => {
        try {
          // The editor sits inside ha-more-info-dialog or the Lovelace editor — walk up the DOM
          let node = this.getRootNode();
          // Find the card element through document or the shadowRoot chain
          const findCard = (root) => {
            if (!root) return null;
            const c = root.querySelector && root.querySelector('multi-air-conditioner-card');
            if (c) return c;
            if (root.host) return findCard(root.host.getRootNode());
            return null;
          };
          const card = findCard(node) || findCard(node && node.host && node.host.getRootNode());
          if (card && card._cas) {
            if (card._cas.phase === 'wait') {
              card._cas = null;  // restart ngay
            } else {
              card._cas.repeatMs = Math.min(15000, Math.max(2000, val));
            }
          }
        } catch(e) { /* silent */ }
      };
      sliderCoolSpeed.addEventListener('input', () => {
        const val = parseInt(sliderCoolSpeed.value);
        const lbl = sr.getElementById('cool-anim-speed-val');
        if (lbl) lbl.textContent = Math.round(val/1000) + 's';
        this._config = { ...this._config, cool_anim_speed: val };
        this._fire();
        _restartCardAnim(val);
      });
      sliderCoolSpeed.addEventListener('change', () => {
        const val = parseInt(sliderCoolSpeed.value);
        this._config = { ...this._config, cool_anim_speed: val };
        this._fire();
        _restartCardAnim(val);
      });
    }

    // ha-entity-picker: sensor entities
    sr.querySelectorAll('ha-entity-picker[data-key]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const k = picker.dataset.key;
        const v = e.detail.value;
        const c = { ...this._config };
        if (v) c[k] = v; else delete c[k];
        this._config = c;
        this._fire();
      }));

    // opacity slider
    const bgAlphaSlider = sr.getElementById('inp-bg-alpha');
    if (bgAlphaSlider) {
      bgAlphaSlider.addEventListener('input', () => {
        const lbl = sr.getElementById('bg-alpha-val-lbl');
        if (lbl) lbl.textContent = bgAlphaSlider.value + '%';
        this._config = { ...this._config, bg_alpha: parseInt(bgAlphaSlider.value) };
        this._fire();
      });
      bgAlphaSlider.addEventListener('change', () => {
        this._config = { ...this._config, bg_alpha: parseInt(bgAlphaSlider.value) };
        this._fire();
      });
    }

    // reset colors button
    const btnResetColors = sr.getElementById('btn-reset-colors');
    if (btnResetColors) btnResetColors.addEventListener('click', () => {
      // accent_color / text_color are absent on purpose: they are not applied
      // anywhere, so 'resetting' them was a promise the card could not keep.
      const resetKeys = [
        'color_title','color_greet_sub','color_greet_name',
        'color_dial_lbl','color_temp_val','color_comfort','color_dial_arc','color_temp_set','color_eta',
        'color_mode_lbl','color_mode_active','color_fc_label','color_fc_val','color_swing_lbl',
        'color_power_lbl','color_timer_lbl','color_alloff_lbl',
        'color_st_title','color_status_on','color_status_off','color_st_sub',
        'color_room_header','color_room_name','color_room_on','color_room_off','color_fan_bar'];
      const c = { ...this._config };
      resetKeys.forEach(k => { delete c[k]; });
      c.bg_alpha = 80;
      this._config = c;
      this._fire();
      this._render();
    });

    // display options toggles
    sr.querySelectorAll('.disp-tog').forEach(tog => {
      tog.addEventListener('change', () => {
        this._config = { ...this._config, [tog.dataset.key]: tog.checked };
        // show_sl_room_power used to be a switch of its own. Once show_power
        // was made to work, the two of them gated the same single row, so the
        // editor was offering two switches for one thing. The one switch now
        // writes both keys, so either key in an existing dashboard still
        // works and the row still needs both to be on.
        if (tog.dataset.key === 'show_power') {
          this._config = { ...this._config, show_sl_room_power: tog.checked };
        }
        this._fire();
        this._render();
      });
    });

    // view mode toggle
    const vmFull = sr.getElementById('vm-full');
    const vmLite = sr.getElementById('vm-lite');
    const vmSuperLite = sr.getElementById('vm-super-lite');
    if (vmFull) vmFull.addEventListener('click', () => {
      this._config = { ...this._config, view_mode: 'full' };
      this._fire(); this._render();
    });
    if (vmLite) vmLite.addEventListener('click', () => {
      this._config = { ...this._config, view_mode: 'lite' };
      this._fire(); this._render();
    });
    if (vmSuperLite) vmSuperLite.addEventListener('click', () => {
      this._config = { ...this._config, view_mode: 'super_lite' };
      this._fire(); this._render();
    });

    // popup style buttons (Super Lite only)
    const psNormal = sr.getElementById('ps-normal');
    const psEffect = sr.getElementById('ps-effect');
    if (psNormal) psNormal.addEventListener('click', () => {
      this._config = { ...this._config, popup_style: 'normal' };
      this._fire(); this._render();
    });
    if (psEffect) psEffect.addEventListener('click', () => {
      this._config = { ...this._config, popup_style: 'effect' };
      this._fire(); this._render();
    });
    const psWave = sr.getElementById('ps-wave');
    if (psWave) psWave.addEventListener('click', () => {
      this._config = { ...this._config, popup_style: 'wave' };
      this._fire(); this._render();
    });
    const togSlFan = sr.getElementById('tog-show-sl-fan');
    if (togSlFan) togSlFan.addEventListener('change', () => {
      this._config = { ...this._config, show_sl_fan: togSlFan.checked };
      this._fire(); this._render();
    });
    const togSlSwing = sr.getElementById('tog-show-sl-swing');
    if (togSlSwing) togSlSwing.addEventListener('change', () => {
      this._config = { ...this._config, show_sl_swing: togSlSwing.checked };
      this._fire(); this._render();
    });
    const togSlRoomPower = sr.getElementById('tog-show-sl-room-power');
    if (togSlRoomPower) togSlRoomPower.addEventListener('change', () => {
      this._config = { ...this._config, show_sl_room_power: togSlRoomPower.checked };
      this._fire(); this._render();
    });
  }
}

customElements.define('multi-air-conditioner-card-editor', MultiAcCardEditor);

customElements.define('multi-air-conditioner-card', AcControllerCardV2);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'multi-air-conditioner-card',
  name: 'Multi Air Conditioner Card',
  description: 'Multi-room air conditioner card with live sensor data, full editor and Chinese/English support.',
  preview: true,
});

console.info(
  '%c ❄ Multi Air Conditioner Card %c v1.10.0 %c ready! 🚀',
  'background:#00d4ff;color:#002030;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;font-size:11px',
  'background:#002030;color:#00d4ff;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;font-size:11px',
  'color:#34d399;font-weight:600;font-size:11px'
);
