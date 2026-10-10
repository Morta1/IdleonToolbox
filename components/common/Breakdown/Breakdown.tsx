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
import { CLIPBOARD_ERROR_MESSAGE, copyText } from "@utility/clipboard";
import useBreakdown from "./Breakdown.hook";
import GameIconNotation from "@components/common/GameIconNotation";
import {
  buildView,
  collectGroupKeys,
  defaultExpandedKeys,
  flattenView,
  hasInactiveNodes,
  toBreakdownTree
} from "./breakdownView";
import type { AnyBreakdown, ViewNode } from "./breakdownView";

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
  const [showInactive, setShowInactive] = useState(false)
  // null until the first toggle, so each tab starts from its own default
  const [expandedKeys, setExpandedKeys] = useState<Set<string> | null>(null)
  // No defaultValue: it would be written back for every breakdown ever opened
  const [pinnedList, setPinnedList] = useLocalStorage<string[]>({ key: `pinned-sources-${data?.statName}` })
  const pinned = new Set(pinnedList ?? [])
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  if (!data) return <>{children}</>

  const tree = toBreakdownTree(data, valueNotation, skipNotation)
  const views = buildView(tree, { valueNotation, skipNotation, query: searchQuery, showInactive, pinned })
  const expanded = expandedKeys ?? defaultExpandedKeys(data, views)
  // Searching opens every group that still has a match
  const isExpanded = (key: string) => !!searchQuery.trim() || expanded.has(key)
  const canHideInactive = hasInactiveNodes(tree)

  const showResult = (succeeded: boolean, successMessage: string) => {
    setFeedbackSeverity(succeeded ? "success" : "error")
    setFeedbackMessage(succeeded ? successMessage : CLIPBOARD_ERROR_MESSAGE)
    setShowFeedback(true)
  }

  const exportRows = () => flattenView(buildView(tree, { valueNotation, skipNotation, query: "", showInactive, pinned }))

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
    ? <GroupRow key={node.key} node={node} isMobile={isMobile} expanded={isExpanded(node.key)}
                onToggle={(event) => toggleGroup(node.key, event)}>
      {renderNodes(node.children)}
    </GroupRow>
    : <LineRow key={node.key} node={node} isMobile={isMobile} pinned={pinned.has(node.pinKey)}
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

const GroupRow = ({ node, expanded, onToggle, isMobile, children }: {
  node: ViewNode,
  expanded: boolean,
  onToggle: (event: React.MouseEvent) => void,
  isMobile: boolean,
  children: React.ReactNode
}) => {
  const topLevel = node.depth === 0
  const isList = node.combine === "list"
  return (
    <Box sx={topLevel ? { borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } } : {}}>
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: indent(node.depth, isMobile),
          pr: isMobile ? 2 : 3,
          py: topLevel ? (isMobile ? 1.75 : 1.5) : 1,
          minHeight: isMobile ? 44 : "auto",
          bgcolor: topLevel ? "transparent" : "rgba(255, 255, 255, 0.03)",
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
          {expanded && node.note ? <Typography variant="caption" color="text.secondary">{node.note}</Typography> : null}
        </Box>
        <Typography variant={isList ? "caption" : "body2"} fontWeight={isList ? 400 : 600}
                    color={isList ? "text.secondary" : "primary.light"} sx={{ whiteSpace: "nowrap" }}>
          {node.display}
        </Typography>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pb: topLevel ? 1 : 0 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

const LineRow = ({ node, pinned, onPin, isMobile }: {
  node: ViewNode,
  pinned: boolean,
  onPin: (event: React.MouseEvent) => void,
  isMobile: boolean
}) => (
  <Box
    sx={{
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
    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{node.display}</Typography>
  </Box>
)

const IconButtonWithTooltip = ({ children, tooltip, onClick }: { children: React.ReactNode, tooltip: string, onClick: () => void }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Tooltip title={tooltip}>
      <IconButton size={isMobile ? "medium" : "small"} onClick={onClick} sx={{
        color: "text.secondary",
        width: 32,
        height: 32
      }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}
