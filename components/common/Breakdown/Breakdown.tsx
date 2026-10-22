import { useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import type * as React from "react";
import {
  Box,
  Typography,
  Collapse,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ImageIcon from "@mui/icons-material/Image";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import { CLIPBOARD_ERROR_MESSAGE, copyText } from "@utility/clipboard";
import useBreakdown from "./Breakdown.hook";
import GameIconNotation from "@components/common/GameIconNotation";
import {
  buildView,
  collectGroupKeys,
  defaultExpandedKeys,
  flattenView,
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

// More notes than this bury the groups worth upgrading under near-zero ones
const TOP_GAINS_SHOWN = 3

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
}

export function Breakdown({ data: dataProp, children, valueNotation = "MultiplierInfo", skipNotation }: BreakdownProps) {
  const datasets = (Array.isArray(dataProp) ? dataProp : [dataProp])
    .filter((entry): entry is AnyBreakdown => !!entry)
  const [activeTab, setActiveTab] = useState(0)
  const data = datasets[Math.min(activeTab, datasets.length - 1)]
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSeverity, setFeedbackSeverity] = useState<"success" | "error">("success");
  const { copyImageToClipboard } = useBreakdown()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

  if (!data) return <>{children}</>

  const tree = toBreakdownTree(data, valueNotation, skipNotation)
  const rootCombine = isLegacyBreakdown(data) ? "list" : data.combine ?? DEFAULT_ROOT_COMBINE
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
    valueNotation, skipNotation, query: searchQuery, showInactive, pinned, rootCombine,
    ...(insightsOn ? { shares, gains, faster } : {})
  })
  const expanded = expandedKeys ?? defaultExpandedKeys(data, views)
  // Searching opens every group that still has a match
  const isExpanded = (key: string) => !!searchQuery.trim() || expanded.has(key)
  const canHideInactive = hasInactiveNodes(tree)

  const showResult = (succeeded: boolean, successMessage: string) => {
    setFeedbackSeverity(succeeded ? "success" : "error")
    setFeedbackMessage(succeeded ? successMessage : CLIPBOARD_ERROR_MESSAGE)
    setShowFeedback(true)
  }

  const exportRows = () => flattenView(buildView(tree, { valueNotation, skipNotation, query: "", showInactive, pinned, rootCombine }))

  const handleCopyImage = async () => {
    const image = { statName: data.statName, totalValue: data.totalValue, rows: exportRows() }
    showResult(await copyImageToClipboard(image), "Copied image to clipboard")
  }

  const handleCopyBreakdown = async () => {
    let text = `${data.statName}: ${data.totalValue}\n\n`
    exportRows().forEach((row) => {
      text += `${"  ".repeat(row.depth)}${row.name}: ${row.display}\n`
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

  return (
    <>
      <Box component="span" sx={{ display: "inline-block", cursor: "pointer" }} onClick={() => setOpen(true)}>
        {children}
      </Box>

      <SwipeableDrawer
        anchor={isMobile ? "bottom" : "right"}
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        // Every instance would add its own edge swipe area, so a swipe opened an arbitrary breakdown
        disableSwipeToOpen
        // SwipeableDrawer keeps a closed drawer mounted for edge swipes; pages hold dozens of these
        ModalProps={{ keepMounted: false }}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2,
        }}
        slotProps={{
          backdrop: {
            sx: { bgcolor: "rgba(0, 0, 0, 0.5)" },
          },
        }}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 420,
            maxWidth: "100vw",
            height: isMobile ? "85vh" : "100%",
            maxHeight: isMobile ? "85vh" : "100%",
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          {isMobile && (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}>
              <Box sx={{ width: 40, height: 4, bgcolor: "divider", borderRadius: 2 }}/>
            </Box>
          )}

          <Box
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              px: isMobile ? 2 : 3,
              py: isMobile ? 1.5 : 2,
              bgcolor: "background.default",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} width="100%">
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                {data.statName}
              </Typography>
              {typeof data.totalValue === 'string' && /[\[!|棘]/.test(data.totalValue)
                ? <GameIconNotation value={data.totalValue} sx={{ fontSize: '1.5rem', fontWeight: 700 }}/>
                : <Typography variant="h5" fontWeight={700}>
                  {data.totalValue}
                </Typography>
              }
            </Stack>
          </Box>

          {datasets.length > 1 ? (
            <Tabs
              value={Math.min(activeTab, datasets.length - 1)}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.default" }}
            >
              {datasets.map((dataset) => <Tab key={dataset.statName} label={dataset.label ?? dataset.statName}/>)}
            </Tabs>
          ) : null}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              px: isMobile ? 1.5 : 2,
              py: isMobile ? 1 : 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <TextField
              size="small"
              placeholder="Search sources..."
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
            />
            {canHideInactive ? (
              <IconButtonWithTooltip tooltip={showInactive ? "Hide inactive" : "Show inactive"}
                                     onClick={() => setShowInactive(!showInactive)}>
                {showInactive ? <VisibilityIcon fontSize="small"/> : <VisibilityOffIcon fontSize="small"/>}
              </IconButtonWithTooltip>
            ) : null}
            {hasInsights ? (
              <IconButtonWithTooltip tooltip={insightsOn ? "Hide contribution and impact" : "Show contribution and impact"}
                                     active={insightsOn} onClick={() => setShowInsights(!showInsights)}>
                <PieChartOutlineIcon fontSize="small"/>
              </IconButtonWithTooltip>
            ) : null}
            <IconButtonWithTooltip tooltip="Expand All" onClick={() => setExpandedKeys(new Set(collectGroupKeys(views)))}>
              <UnfoldMoreIcon fontSize="small"/>
            </IconButtonWithTooltip>
            <IconButtonWithTooltip tooltip="Collapse All" onClick={() => setExpandedKeys(new Set())}>
              <UnfoldLessIcon fontSize="small"/>
            </IconButtonWithTooltip>
            <IconButtonWithTooltip tooltip="Copy as Text" onClick={handleCopyBreakdown}>
              <ContentCopyIcon fontSize="small"/>
            </IconButtonWithTooltip>
            <IconButtonWithTooltip tooltip="Copy as Image" onClick={handleCopyImage}>
              <ImageIcon fontSize="small"/>
            </IconButtonWithTooltip>
          </Stack>

          {insightsOn ? (
            <Typography variant="caption" color="text.secondary" sx={{ px: isMobile ? 2 : 3, pt: 1 }}>
              % = share of your total
            </Typography>
          ) : null}
          {insightsOn && showRootGain ? (
            <Typography variant="caption" color="text.secondary" sx={{ px: isMobile ? 2 : 3 }}>
              Add +{GAIN_STEP}%: total {formatGain(rootGain)}
            </Typography>
          ) : null}

          <Box sx={{ flexGrow: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", py: 1 }}>
            {renderNodes(views)}
          </Box>
        </Box>
      </SwipeableDrawer>

      <Snackbar
        open={showFeedback}
        autoHideDuration={feedbackSeverity === "error" ? 5000 : 2000}
        onClose={() => setShowFeedback(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={feedbackSeverity} variant="filled" onClose={() => setShowFeedback(false)}>
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

const indent = (depth: number, isMobile: boolean) => (isMobile ? 2 : 3) + depth * 2

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
      color: isBest ? "success.main" : "text.secondary",
      fontWeight: isBest ? 600 : 400
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
        sx={{
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: indent(node.depth, isMobile),
          pr: isMobile ? 2 : 3,
          py: topLevel ? (isMobile ? 1.75 : 1.5) : 1,
          minHeight: isMobile ? 44 : "auto",
          bgcolor: isBest ? "rgba(102, 187, 106, 0.1)" : topLevel ? "transparent" : "rgba(255, 255, 255, 0.03)",
          boxShadow: (theme) => isBest ? `inset 3px 0 0 ${theme.palette.success.main}` : "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "text.primary",
          transition: "background-color 0.2s",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.06)",
          },
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
        <Typography variant={isList ? "caption" : "body2"} fontWeight={isList ? 400 : 600}
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
      py: isMobile ? 1.25 : 0.75,
      minHeight: isMobile ? 44 : "auto",
      opacity: node.inactive ? 0.5 : 1,
      transition: "background-color 0.2s",
      bgcolor: pinned ? "rgba(255, 215, 0, 0.1)" : "transparent",
      "&:hover": {
        bgcolor: pinned ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 255, 255, 0.05)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <IconButton
        size="small"
        onClick={onPin}
        sx={{
          p: 0.5,
          color: pinned ? "#FFD700" : "text.secondary",
          opacity: pinned ? 1 : 0.3,
          transition: "opacity 0.2s, color 0.2s",
          "&:hover": {
            opacity: 1,
            bgcolor: "transparent",
          },
        }}
      >
        {pinned ? <StarIcon sx={{ fontSize: 16 }}/> : <StarBorderIcon sx={{ fontSize: 16 }}/>}
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

const IconButtonWithTooltip = ({ children, tooltip, onClick, active }: {
  children: React.ReactNode,
  tooltip: string,
  onClick: (event: React.MouseEvent<HTMLElement>) => void,
  active?: boolean
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Tooltip title={tooltip}>
      <IconButton size={isMobile ? "medium" : "small"} onClick={onClick} sx={{
        color: active ? "primary.main" : "text.secondary",
        width: 32,
        height: 32
      }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}
