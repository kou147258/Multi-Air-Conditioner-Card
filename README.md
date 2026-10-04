# Multi Air Conditioner Card

> **A modified fork.** Original work and MIT licence:
> [doanlong1412/Multi-Air-Conditioner-Card](https://github.com/doanlong1412/Multi-Air-Conditioner-Card) — Copyright © 2024 doanlong1412.
> See [LICENSE](LICENSE).

**[中文](#中文) · [English](#english)**

---

<a name="中文"></a>

# 多房间空调卡片

多房间空调中控卡片：实时传感器、完整可视化编辑器、中英双语界面。

## 这是什么

一张 Home Assistant 自定义卡片，把多台（或一台多联机）的空调集中在一块面板上：
温度、模式、风速、扫风、开关机、PM2.5、室内外温湿度、每个房间的独立状态和快捷开关。
所有配置都能在卡片自带的编辑器里点出来，不用手写 YAML。

## 本仓库的改动（v1.10.0）

基于上游 v1.9.2，主要改动：

| | 改动 | 修复的问题 |
|---|---|---|
| 🎨 | **扫风图标重做**：图标现在编码导风板的位置和状态 | 原来的波浪线和尖括号表意太抽象，认不出是哪个控制 |
| 🐛 | **左右扫风按钮读错实体** | 它一直在读上下扫风的状态，所以上下扫风开着时它才亮、才动，真正开左右扫风时反而是死的 |
| 🐛 | **三个控件各坏各的，其中两个点了完全没反应** | Lite 视图的开机按钮和 Super Lite 的房间选择器读到了只存在于渲染函数内部的变量，点击时抛异常 |
| 🐛 | **表盘拖拽被中途重渲染打断** | 拖动过程中状态一变，SVG 被换掉，手势就断了，松手还会提交一个你根本没拖到的温度 |
| 🐛 | **`setConfig` 不触发重渲染** | 编辑器改完配置，卡片不更新 |
| 🐛 | **模式图标一直转圈** | 制热/除湿/送风时也在转，但那些模式并不驱动导风板；现在只在自动和制冷时转 |
| 🔒 | **HTML 转义加固** | 实体名、风阀名、房间名里的特殊字符会破坏渲染，甚至能注入标记 |
| 🔌 | **接上了几个死开关** | `show_power` / `power_entity` 在编辑器里能填，但代码从不读 |

## 安装

### HACS（推荐）

1. HACS → 集成 → 右上角菜单 → **自定义存储库**
2. 添加 `https://github.com/kou147258/Multi-Air-Conditioner-Card`
3. 搜索 **Multi Air Conditioner Card** 并安装
4. **重启 Home Assistant**
5. HACS 里把卡片添加到仪表盘，打开卡片右上角菜单 → **编辑**（不需要写 YAML）

### 手动

把 `multi-air-conditioner-card.js` 放进 `<config>/www/`，
然后在 **设置 → 高级 → 资源** 里加一条：

| 字段 | 值 |
|---|---|
| URL | `/local/multi-air-conditioner-card.js?v=1` |
| 类型 | JavaScript Module |

`?v=` 是缓存版本号。**卡片改过之后要把它加 1**（`?v=2`），否则浏览器还会用旧的。

## 最小配置

```yaml
type: custom:multi-air-conditioner-card
view_mode: full       # full | lite | super_lite，默认 full
owner_name: 智能家庭
entities:
  - entity_id: climate.living_room_ac
    label: 客厅
```

装好之后**建议直接在编辑器里配**，上面这段只是让你知道它认哪些字段。

### 语言

**界面语言跟随 Home Assistant，卡片里没有语言开关。**
HA 界面语言是简体中文时显示中文，其余一律英文。
`zh` / `zh-cn` / `zh-sg` / `zh-my` / `zh-hans` / `zh-hans-cn` 算中文。

> ⚠️ YAML 里写 `language: zh` **没有作用**——卡片会在首次拿到 HA 数据时用
> `hass.language` 覆盖掉这个值。要改语言，请改 HA 自己的语言设置。

### 常用字段

| 字段 | 说明 |
|---|---|
| `view_mode` | `full` 完整视图 / `lite` 精简 / `super_lite` 极简 |
| `owner_name` | 顶部问候语里的名字 |
| `entities[].image` | 房间背景图 URL |
| `entities[].quick_switches` | 房间卡片上的快捷开关（`entity_id` 列表） |
| `show_hswing` | 是否显示左右扫风按钮（实体不发布时自动隐藏） |
| `outdoor_temp_entity` / `outdoor_humidity_entity` / `pm25_entity` | 室外温度 / 湿度 / PM2.5 |
| `temp_unit` | `C` / `F` |

完整的字段列表在编辑器的「高级」里都有中文说明。

## 已知限制

- 左右扫风按钮只在实体发布了 `swing_horizontal_mode` 时出现
- `accent_color` 和 `text_color` 目前**读了但没有应用**，编辑器里能看到但不影响外观
- 上游仍在更新，本仓库不一定同步

## 致谢

原作者 [doanlong1412](https://github.com/doanlong1412) 的 MIT 项目。
本仓库的修改同样以 MIT 发布。

---

<a name="english"></a>

# Multi Air Conditioner Card

A multi-room air conditioner control card for Home Assistant: live sensors, a
full visual editor, and a Chinese/English interface.

## What this is

A Home Assistant custom card that puts several air conditioners (or one
multi-split system) on a single panel: temperature, mode, fan speed, swing,
power, PM2.5, indoor and outdoor temperature/humidity, per-room status and quick
switches. Everything is configurable from the card's built-in editor — no YAML
required.

## What this fork changes (v1.10.0)

Based on upstream v1.9.2:

| | Change | The problem it fixes |
|---|---|---|
| 🎨 | **Swing icons redesigned** — the glyph now encodes where the louver is and whether it is moving | The old waves and chevrons were abstract and read like the *other* control |
| 🐛 | **The left/right swing button read the wrong entity** | It read the vertical swing state, so it lit up and animated whenever the up/down sweep was on, and stayed dead while the horizontal one was actually running |
| 🐛 | **Three controls were each broken differently, and two did nothing at all** | The Lite-view power button and the Super Lite room picker read names that only exist inside the render methods, so clicking them threw |
| 🐛 | **Dial drag was interrupted by a re-render** | A state change mid-gesture replaced the SVG the drag was bound to, and releasing then committed a temperature you never dragged to |
| 🐛 | **`setConfig` did not re-render** | Changing the config in the editor left the card stale |
| 🐛 | **Mode icons always spun** | Heating/dry/fan-only spun too, though those modes do not drive the louvers; now only Auto and Cool spin |
| 🔒 | **HTML escaping hardened** | Special characters in entity, damper and room names could break rendering, and in some cases inject markup |
| 🔌 | **Dead config switches wired up** | `show_power` / `power_entity` were editable in the editor but never read by the code |

## Installation

### HACS (recommended)

1. HACS → Integrations → ⋮ menu → **Custom repositories**
2. Add `https://github.com/kou147258/Multi-Air-Conditioner-Card`
3. Search for **Multi Air Conditioner Card** and install
4. **Restart Home Assistant**
5. Add the card to a dashboard, then open the card's ⋮ menu → **Edit** (no YAML needed)

### Manual

Drop `multi-air-conditioner-card.js` into `<config>/www/`, then add a row under
**Settings → Advanced → Resources**:

| Field | Value |
|---|---|
| URL | `/local/multi-air-conditioner-card.js?v=1` |
| Type | JavaScript Module |

`?v=` is a cache-busting version. **Bump it after every card update**
(`?v=2`) or the browser will keep serving the old file.

## Minimal configuration

```yaml
type: custom:multi-air-conditioner-card
view_mode: full       # full | lite | super_lite, defaults to full
owner_name: My Home
entities:
  - entity_id: climate.living_room_ac
    label: Living Room
```

Once installed, **configure it in the editor** — the snippet above is just here
so you know which keys it understands.

### Language

**The interface language follows Home Assistant.** There is no language switch
in the card: it renders in Chinese when the HA interface language is Simplified
Chinese, and in English for everything else. `zh` / `zh-cn` / `zh-sg` / `zh-my` /
`zh-hans` / `zh-hans-cn` count as Chinese.

> ⚠️ Setting `language: zh` in YAML has **no effect** — the card overwrites that
> value from `hass.language` as soon as it first receives data from HA. To change
> the language, change it in Home Assistant.

### Common options

| Key | Description |
|---|---|
| `view_mode` | `full` / `lite` / `super_lite` |
| `owner_name` | Name shown in the top greeting |
| `entities[].image` | Room background image URL |
| `entities[].quick_switches` | Quick switches on the room card (list of `entity_id`) |
| `show_hswing` | Show the left/right swing button (auto-hidden if the entity is absent) |
| `outdoor_temp_entity` / `outdoor_humidity_entity` / `pm25_entity` | Outdoor temperature / humidity / PM2.5 |
| `temp_unit` | `C` / `F` |

The editor documents every key under its advanced section.

## Known limitations

- The left/right swing button only appears when the entity publishes
  `swing_horizontal_mode`
- `accent_color` and `text_color` are read but **not applied**; they are visible
  in the editor but change nothing
- Upstream is still active, so this fork may drift

## Credits

Original MIT project by [doanlong1412](https://github.com/doanlong1412).
The modifications in this repository are released under the same licence.
