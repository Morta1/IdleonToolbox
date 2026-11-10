import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { useRouter } from "next/compat/router";
import { breakdownKey } from "@utility/breakdownSearch";
import type * as React from "react";
import {
  Box,
  Typography,
  Collapse,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  ButtonBase,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  Divider,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconClipboardText, IconPhoto, IconPin, IconPinFilled } from "@tabler/icons-react";
import { CLIPBOARD_ERROR_MESSAGE, copyText } from "@utility/clipboard";
import { notify } from "@components/common/Overlays/notify";
import AppDrawer from "@components/common/Overlays/AppDrawer";
import Notice from "@components/common/Notice";
import WithLastWord from "@components/common/WithLastWord";
import { menuCheck } from "@components/common/Overlays/menuCheck";
import useBreakdown from "./Breakdown.hook";
import GameIconNotation from "@components/common/GameIconNotation";
import {
  buildView,
  collectGroupKeys,
  countLines,
  defaultExpandedKeys,
  flattenView,
  formatTotal,
  hasInactiveNodes,
  isLegacyBreakdown,
  toBreakdownTree
} from "./breakdownView";
import { DEFAULT_ROOT_COMBINE } from "@parsers/breakdown";
import type { BreakdownNode } from "@parsers/breakdown";
import type { AnyBreakdown, ViewNode } from "./breakdownView";
import {
  computeGains,
  computeRootGain,
  computeShares,
  findDivisorNodes,
  formatGain,
  formatShare,
  GAIN_STEP
} from "./breakdownInsights";
import { ink } from '../../../styles/theme/theme';

// More notes than this bury the groups worth upgrading under near-zero ones
const TOP_GAINS_SHOWN = 3
// A list breakdown's lines from which its drawer offers a search
const SEARCH_FROM = 10

// Info board: a value that opens a breakdown carries a 14 px bars glyph, and a hover tints the whole value
const VALUE_TRIGGER_SX = { "&:hover": { bgcolor: "primary.soft" } }

// Totals the header draws as game icons (GameIconNotation) carry these markers
const ICON_NOTATION = /[\[!|棘]/

// A `?breakdown=` link opens only the first matching breakdown: per-unit stats mount one per unit
const linkClaim = { path: "" }
const claimLink = (path: string) => {
  if (linkClaim.path === path) return false
  linkClaim.path = path
  return true
}
const releaseLink = () => {
  linkClaim.path = ""
}

interface RowInsight {
  on: boolean
  bestGain?: number
  // The smallest impact still shown: only the top groups get a note
  minShownGain?: number
}

interface BreakdownProps {
  // A breakdown tree (parsers/breakdown.ts) or the older categories shape; several open as tabs
  data?: AnyBreakdown | (AnyBreakdown | undefined | null)[]
  children: React.ReactNode
  // Notation for lines that carry no unit (the older shape)
  valueNotation?: string
  skipNotation?: boolean
  // The children are the value itself (StatTile, ItemCard facts), not an icon beside it
  asValue?: boolean
  // The drawer's name when the trigger names the stat otherwise (a tile's label); statName stays the key of
  // its pins and its ?breakdown= link
  title?: string
  // What a list's lines count as ("11 characters"), when they are not sources
  countNoun?: string
}

export function Breakdown({ data: dataProp, children, valueNotation = "MultiplierInfo", skipNotation, asValue = false, title, countNoun }: BreakdownProps) {
  const datasets = (Array.isArray(dataProp) ? dataProp : [dataProp])
    .filter((entry): entry is AnyBreakdown => !!entry)
  const [activeTab, setActiveTab] = useState(0)
  const data = datasets[Math.min(activeTab, datasets.length - 1)]
  const { copyImageToClipboard } = useBreakdown()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchField = useRef<HTMLInputElement>(null)
  // Zero sources stay listed (dimmed) so players see what they can still improve
  const [showInactive, setShowInactive] = useLocalStorage<boolean>({ key: "breakdown-show-inactive", defaultValue: true })
  // Contribution and upgrade impact, shown together
  const [showInsights, setShowInsights] = useLocalStorage<boolean>({ key: "breakdown-insights", defaultValue: true })
  // null until the first toggle, so each tab starts from its own default
  const [expandedKeys, setExpandedKeys] = useState<Set<string> | null>(null)
  // No defaultValue: it would be written back for every breakdown ever opened
  const [pinnedList, setPinnedList] = useLocalStorage<string[]>({ key: `pinned-sources-${data?.statName}` })
  const pinned = new Set(pinnedList ?? [])
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const router = useRouter()
  const linkedKey = router?.isReady ? router.query.breakdown : undefined
  const datasetKeys = datasets.map((dataset) => breakdownKey(dataset.statName)).join("|")
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof linkedKey !== "string") {
      releaseLink()
      return
    }
    const index = datasetKeys.split("|").indexOf(linkedKey)
    if (!router || index === -1 || !claimLink(router.asPath)) return
    const { breakdown: _breakdown, ...query } = router.query
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false })
      .then(() => {
        setActiveTab(index)
        setOpen(true)
      })
  }, [linkedKey, datasetKeys])

  if (!data) return <>{children}</>

  const name = title || data.statName
  // "Power breakdown, 2.66e26": the total only when it is plain text
  const totalText = formatTotal(data, valueNotation, skipNotation)
  const plainTotal = totalText !== "" && !ICON_NOTATION.test(totalText)
  const triggerName = plainTotal ? `${name} breakdown, ${totalText}` : `${name} breakdown`

  const tree = toBreakdownTree(data, valueNotation, skipNotation)
  const rootCombine = isLegacyBreakdown(data) ? "list" : data.combine ?? DEFAULT_ROOT_COMBINE
  // A short list (the two next happy hours) is read at a glance: its drawer has no search until SEARCH_FROM lines
  const searchable = isLegacyBreakdown(data) || data.combine !== "list"
    || tree.reduce((lines, node) => lines + countLines(node), 0) >= SEARCH_FROM
  // Only an open drawer pays for them; pages hold dozens of closed breakdowns
  const shares = open ? computeShares(tree, rootCombine) : new Map()
  const gains = open ? computeGains(tree, rootCombine) : new Map()
  // Like the row notes, a gain a cap or floor swallows is not worth a line
  const rootGain = open ? computeRootGain(tree, rootCombine) : undefined
  const showRootGain = rootGain !== undefined && rootGain > 0
  const faster = open ? findDivisorNodes(tree, rootCombine) : new Set<BreakdownNode>()
  const hasInsights = shares.size > 0 || gains.size > 0 || showRootGain
  const insightsOn = showInsights && hasInsights
  const gainValues: number[] = [...gains.values()]
  // A best group only means something when there are groups to compare
  const bestGain = gainValues.length > 1 && Math.max(...gainValues) > 0 ? Math.max(...gainValues) : undefined
  const shownGains = gainValues.filter((gain) => gain > 0).sort((a, b) => b - a).slice(0, TOP_GAINS_SHOWN)
  const insight: RowInsight = { on: insightsOn, bestGain, minShownGain: shownGains.at(-1) }
  const views = buildView(tree, {
    valueNotation, skipNotation, countNoun, query: searchQuery, showInactive, pinned, rootCombine,
    ...(insightsOn ? { shares, gains, faster } : {})
  })
  const expanded = expandedKeys ?? defaultExpandedKeys(data, views)
  // Searching opens every group that still has a match
  const isExpanded = (key: string) => !!searchQuery.trim() || expanded.has(key)
  const canHideInactive = hasInactiveNodes(tree)
  const hasToggles = canHideInactive || hasInsights

  const runFromMenu = (action: () => void) => {
    setMenuAnchor(null)
    action()
  }

  // The total sits in the header beside the name, or under it when both don't fit (OverlayHeader); a text total
  // longer than its own line wraps between words. sx, not variant: the build type-checks .tsx files and
  // Typography's variant type does not know the theme's sectionTitle.
  const total = ICON_NOTATION.test(totalText)
    ? <GameIconNotation value={totalText} sx={{ typography: "sectionTitle" }}/>
    : <Box component="span" sx={{ typography: "sectionTitle" }}>{totalText}</Box>

  const showResult = (succeeded: boolean, successMessage: string) => {
    notify(succeeded ? successMessage : CLIPBOARD_ERROR_MESSAGE)
  }

  // Exports carry the drawer's % column only while it is shown
  const exportRows = () => flattenView(buildView(tree, {
    valueNotation, skipNotation, countNoun, query: "", showInactive, pinned, rootCombine, ...(insightsOn ? { shares } : {})
  })).map((row) => ({ ...row, shareText: row.share !== undefined && !row.inactive ? formatShare(row.share) : "" }))

  const handleCopyImage = async () => {
    const image = { statName: name, totalValue: totalText, rows: exportRows() }
    showResult(await copyImageToClipboard(image), "Copied image to clipboard")
  }

  const handleCopyBreakdown = async () => {
    let text = `${name}: ${totalText}\n\n`
    exportRows().forEach((row) => {
      text += `${"  ".repeat(row.depth)}${row.name}: ${row.display}${row.shareText ? ` (${row.shareText})` : ""}\n`
    })
    showResult(await copyText(text), "Copied text to clipboard")
  }

  const handleTabChange = (_: React.SyntheticEvent, index: number) => {
    setActiveTab(index)
    setExpandedKeys(null)
  }

  const toggleGroup = (key: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const next = new Set(expanded)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setExpandedKeys(next)
  }

  const togglePin = (pinKey: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setPinnedList((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(pinKey)) {
        next.delete(pinKey)
      } else {
        next.add(pinKey)
      }
      return Array.from(next)
    })
  }

  const renderNodes = (nodes: ViewNode[]): React.ReactNode => nodes.map((node) => node.children
    ? <GroupRow key={node.key} node={node} isMobile={isMobile} insight={insight} expanded={isExpanded(node.key)}
                onToggle={(event) => toggleGroup(node.key, event)}>
      {renderNodes(node.children)}
    </GroupRow>
    : <LineRow key={node.key} node={node} isMobile={isMobile} insight={insight} pinned={pinned.has(node.pinKey)}
               onPin={(event) => togglePin(node.pinKey, event)}/>)

  // Stays put under the header while the sources scroll.
  const toolbar = <>
    {datasets.length > 1 ? (
      <Tabs
        value={Math.min(activeTab, datasets.length - 1)}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        {datasets.map((dataset) => <Tab key={dataset.statName} label={dataset.label ?? dataset.statName}/>)}
      </Tabs>
    ) : null}

    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      spacing={1}
      sx={{
        px: isMobile ? 1.5 : 2,
        py: isMobile ? 1 : 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {searchable ? <TextField
        size="small"
        placeholder="Search"
        inputProps={{ "aria-label": "Search sources" }}
        inputRef={searchField}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          flexGrow: 1,
          "& .MuiOutlinedInput-root": {
            fontSize: "0.875rem",
            color: "text.primary",
            minHeight: isMobile ? 40 : "auto",
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "text.secondary",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
            },
          },
          "& .MuiInputBase-input::placeholder": {
            color: "text.secondary",
            opacity: 0.7,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }}/>
            </InputAdornment>
          ),
        }}
      /> : null}
      {/* The two copies, the most used actions, out of the menu (#85, acecow), named on hover as Toolbar's sort button
          is. The menu keeps them, named, for a touch screen, which shows no tooltip: a tap's emulated hover would open
          it as the copy runs. */}
      <Tooltip title="Copy as text" disableTouchListener>
        <IconButton aria-label="Copy as text" onClick={handleCopyBreakdown} sx={{ color: "text.secondary", width: 32, height: 32 }}>
          <IconClipboardText size={18}/>
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy as image" disableTouchListener>
        <IconButton aria-label="Copy as image" onClick={handleCopyImage} sx={{ color: "text.secondary", width: 32, height: 32 }}>
          <IconPhoto size={18}/>
        </IconButton>
      </Tooltip>
      <IconButton
        aria-label="Breakdown options"
        aria-haspopup="menu"
        aria-expanded={!!menuAnchor}
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        // 40 px on touch comes from the theme's IconButton minimum
        sx={{ color: "text.secondary", width: 32, height: 32 }}
      >
        <MoreHorizIcon fontSize="small"/>
      </IconButton>
    </Stack>

    {/* Every action named in text: the icon buttons this replaces named themselves only on hover */}
    <Menu
      anchorEl={menuAnchor}
      open={!!menuAnchor}
      onClose={() => setMenuAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {canHideInactive ? menuCheck(showInactive, "Show inactive sources", () => runFromMenu(() => setShowInactive(!showInactive))) : null}
      {hasInsights ? menuCheck(insightsOn, "Show share and impact", () => runFromMenu(() => setShowInsights(!showInsights))) : null}
      {hasToggles ? <Divider/> : null}
      <MenuItem onClick={() => runFromMenu(() => setExpandedKeys(new Set(collectGroupKeys(views))))}>
        <ListItemText inset={hasToggles}>Expand all</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => runFromMenu(() => setExpandedKeys(new Set()))}>
        <ListItemText inset={hasToggles}>Collapse all</ListItemText>
      </MenuItem>
      <Divider/>
      <MenuItem onClick={() => runFromMenu(handleCopyBreakdown)}>
        <ListItemText inset={hasToggles}>Copy as text</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => runFromMenu(handleCopyImage)}>
        <ListItemText inset={hasToggles}>Copy as image</ListItemText>
      </MenuItem>
    </Menu>

    {insightsOn ? (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: isMobile ? 2 : 3, pt: 1 }}>
        % = share of your total
      </Typography>
    ) : null}
    {insightsOn && showRootGain ? (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: isMobile ? 2 : 3 }}>
        Add +{GAIN_STEP}%: total {formatGain(rootGain)}
      </Typography>
    ) : null}
  </>

  return (
    <>
      {/* A span, not a <button>: callers pass block content (Stacks, sprites). ButtonBase gives it the
          button role, Enter and Space, and the theme's focus ring. */}
      <ButtonBase
        component="span"
        disableRipple
        aria-label={triggerName}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        // ButtonBase is an inline-flex box aligned to the middle; the span it replaces was an inline block.
        // It also makes its text unselectable and becomes the box absolute children place against: undo both.
        sx={[
          { display: "inline-block", verticalAlign: "baseline", borderRadius: 1, userSelect: "text", position: "static" },
          asValue && VALUE_TRIGGER_SX
        ]}
      >
        {/* A value in words wraps before its last word and the glyph, so the glyph never takes a line of its own */}
        {asValue && typeof children === "string" ? <WithLastWord text={children}><ValueGlyph/></WithLastWord> : <>{children}{asValue ? <ValueGlyph/> : null}</>}
      </ButtonBase>

      <AppDrawer open={open} onClose={() => setOpen(false)} title={name} aside={total} toolbar={toolbar}>
        <Box sx={{ py: 1 }}>
          {/* A search that matches no source says so, with the step that brings the rows back */}
          {views.length || !searchQuery.trim()
            ? renderNodes(views)
            : <Notice sx={{ px: isMobile ? 2 : 3, py: 1 }} action={{ label: "Clear search", onClick: () => setSearchQuery("") }}
                      focusAfter={searchField}>
              {`No source matches “${searchQuery.trim()}”.`}
            </Notice>}
        </Box>
      </AppDrawer>
    </>
  )
}

// Three lines getting shorter: there is a breakdown behind this value (Info board).
const BreakdownGlyph = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
  <path d="M4 6h16M4 12h11M4 18h6"/>
</svg>
const ValueGlyph = () => <Box component="span" aria-hidden sx={{ display: "inline-flex", ml: 0.5, color: "primary.main", verticalAlign: "-2px" }}>
  <BreakdownGlyph/>
</Box>

const indent = (depth: number, isMobile: boolean) => (isMobile ? 2 : 3) + depth * 2

// A phone's rows are the board's 34 px, about 12 lines on screen. A row's pin keeps a 44 px wide tap target as tall as
// its row: the theme's 40 px touch minimum would make each row 60 px.
const PIN_TOUCH = { "@media (pointer: coarse)": { minWidth: 24, minHeight: 24, "&::before": { content: '""', position: "absolute", inset: "-5px -10px" } } }

// A fixed width keeps every row's value in one column
const InsightCell = ({ node, insight }: { node: ViewNode, insight: RowInsight }) => {
  if (!insight.on) return null
  return (
    <Typography variant="caption" color="text.secondary" sx={{ width: 52, flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}>
      {node.share !== undefined && !node.inactive ? formatShare(node.share) : ""}
    </Typography>
  )
}

// Under a group's name; lines get none, since every line in a group gains the same
const ImpactNote = ({ node, insight }: { node: ViewNode, insight: RowInsight }) => {
  if (!insight.on || node.gain === undefined) return null
  if (insight.minShownGain === undefined || node.gain < insight.minShownGain) return null
  const isBest = node.gain === insight.bestGain
  return (
    <Typography variant="caption" component="div" sx={{
      color: isBest ? "text.success" : "text.secondary",
      fontWeight: isBest ? 600 : undefined
    }}>
      Add +{GAIN_STEP}% here: {node.faster ? "speed" : "total"} {formatGain(node.gain)}
    </Typography>
  )
}

// Thinner than this the bar reads as a stray dot
const MIN_BAR_SHARE = 1

const ShareBar = ({ node, insight, isMobile }: { node: ViewNode, insight: RowInsight, isMobile: boolean }) => {
  if (!insight.on || !node.share || node.share < MIN_BAR_SHARE) return null
  return (
    <Box sx={{
      position: "absolute",
      bottom: 2,
      left: (theme) => theme.spacing(indent(node.depth, isMobile)),
      right: (theme) => theme.spacing(isMobile ? 2 : 3),
      pointerEvents: "none"
    }}>
      <Box sx={{ width: `${Math.min(node.share, 100)}%`, height: 2, borderRadius: 1, bgcolor: "primary.main", opacity: 0.6 }}/>
    </Box>
  )
}

const GroupRow = ({ node, expanded, onToggle, isMobile, insight, children }: {
  node: ViewNode,
  insight: RowInsight,
  expanded: boolean,
  onToggle: (event: React.MouseEvent) => void,
  isMobile: boolean,
  children: React.ReactNode
}) => {
  const topLevel = node.depth === 0
  const isList = node.combine === "list"
  const isBest = insight.on && node.gain !== undefined && node.gain === insight.bestGain
  return (
    <Box sx={topLevel ? { borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } } : {}}>
      <Box
        component="button"
        onClick={onToggle}
        aria-expanded={expanded}
        sx={{
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: indent(node.depth, isMobile),
          pr: isMobile ? 2 : 3,
          py: isMobile ? "7px" : topLevel ? 1.5 : 1,
          minHeight: isMobile ? 34 : "auto",
          bgcolor: isBest ? "rgba(var(--mui-palette-success-mainChannel) / 0.1)" : topLevel ? "transparent" : ink(0.03),
          boxShadow: isBest ? 'inset 3px 0 0 var(--mui-palette-success-main)' : 'none',
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "text.primary",
          transition: "background-color 0.2s",
          "&:hover": {
            bgcolor: ink(0.06),
          },
          // The CssBaseline ring is drawn outside, and the scrolling list clips it
          "&:focus-visible": { outlineOffset: -2 },
        }}
      >
        <ChevronRightIcon
          sx={{
            fontSize: topLevel ? 20 : 16,
            color: "text.secondary",
            transition: "transform 0.2s",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={topLevel ? 600 : 500} sx={{ opacity: node.inactive ? 0.5 : 1 }}>
            {node.name}
          </Typography>
          {node.note ? <Typography variant="caption" color="text.secondary">{node.note}</Typography> : null}
          <ImpactNote node={node} insight={insight}/>
        </Box>
        <Typography variant={isList ? "caption" : "body2"} fontWeight={isList ? undefined : 600}
                    color={isList ? "text.secondary" : "primary.light"} sx={{ whiteSpace: "nowrap" }}>
          {node.display}
        </Typography>
        <InsightCell node={node} insight={insight}/>
        <ShareBar node={node} insight={insight} isMobile={isMobile}/>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pb: topLevel ? 1 : 0 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

const LineRow = ({ node, pinned, onPin, isMobile, insight }: {
  node: ViewNode,
  insight: RowInsight,
  pinned: boolean,
  onPin: (event: React.MouseEvent) => void,
  isMobile: boolean
}) => (
  <Box
    sx={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1,
      pl: indent(node.depth, isMobile),
      pr: isMobile ? 2 : 3,
      py: isMobile ? "5px" : 0.75,
      minHeight: isMobile ? 34 : "auto",
      opacity: node.inactive ? 0.5 : 1,
      transition: "background-color 0.2s",
      bgcolor: pinned ? "primary.soft" : "transparent",
      "&:hover": {
        bgcolor: pinned ? "primary.soft" : "background.tint",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <IconButton
        size="small"
        onClick={onPin}
        aria-label={`${pinned ? "Unpin" : "Pin"} ${node.name}`}
        aria-pressed={pinned}
        sx={{
          p: 0.5,
          color: pinned ? "primary.main" : "text.secondary",
          opacity: pinned ? 1 : 0.3,
          transition: "opacity 0.2s, color 0.2s",
          "&:hover": {
            opacity: 1,
            bgcolor: "transparent",
          },
          ...PIN_TOUCH,
        }}
      >
        {pinned ? <IconPinFilled size={16}/> : <IconPin size={16}/>}
      </IconButton>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.primary" sx={{ opacity: 0.8 }}>
          {node.name}
        </Typography>
        {node.note ? <Typography variant="caption" color="text.secondary">{node.note}</Typography> : null}
      </Box>
    </Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{node.display}</Typography>
      <InsightCell node={node} insight={insight}/>
    </Box>
    <ShareBar node={node} insight={insight} isMobile={isMobile}/>
  </Box>
)
