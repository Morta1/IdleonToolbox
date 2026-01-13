import { useState, useMemo, useEffect } from "react";
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
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  Tooltip,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ImageIcon from "@mui/icons-material/Image";
import { notateNumber } from "@utility/helpers";
import useBreakdown from "./Breakdown.hook";


interface StatSource {
  name: string
  value: number
}

interface SubSection {
  name: string
  sources: StatSource[]
}

interface StatCategory {
  name: string
  sources?: StatSource[]
  subSections?: SubSection[]
}

interface StatBreakdownData {
  statName: string
  totalValue: number
  categories: StatCategory[]
}

interface StatBreakdownTooltipProps {
  data: StatBreakdownData
  children: React.ReactNode
  valueNotation?: string
  skipNotation?: boolean
}

export function Breakdown({ data, children, valueNotation = "MultiplierInfo", skipNotation }: StatBreakdownTooltipProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { copyImageToClipboard } = useBreakdown({ data, valueNotation, setFeedbackMessage, setShowFeedback, skipNotation })
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]))
  const [expandedSubSections, setExpandedSubSections] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [pinnedSources, setPinnedSources] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(`pinned-sources-${data.statName}`)
    if (stored) {
      try {
        return new Set(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load pinned sources", e)
      }
    }
    return new Set()
  })

  const handleClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    localStorage.setItem(`pinned-sources-${data.statName}`, JSON.stringify(Array.from(pinnedSources)))
  }, [pinnedSources, data.statName])

  const toggleCategory = (index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleSubSection = (categoryIdx: number, subSectionIdx: number, event: React.MouseEvent) => {
    event.stopPropagation()
    const key = `${categoryIdx}-${subSectionIdx}`
    setExpandedSubSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    const allCategories = new Set(data.categories.map((_, idx) => idx))
    setExpandedCategories(allCategories)

    const allSubSections = new Set<string>()
    data.categories.forEach((category, catIdx) => {
      category.subSections?.forEach((_, subIdx) => {
        allSubSections.add(`${catIdx}-${subIdx}`)
      })
    })
    setExpandedSubSections(allSubSections)
  }

  const handleCollapseAll = () => {
    setExpandedCategories(new Set())
    setExpandedSubSections(new Set())
  }

  const handleCopyBreakdown = () => {
    let text = `${data.statName}: ${data.totalValue}\n\n`

    data.categories.forEach((category) => {
      text += `${category.name}:\n`

      if (category.sources) {
        category.sources.forEach((source) => {
          text += `  ${source.name}: ${skipNotation ? source.value : notateNumber(source.value, valueNotation)}\n`
        })
      }

      if (category.subSections) {
        category.subSections.forEach((subSection) => {
          text += `  ${subSection.name}:\n`
          subSection.sources.forEach((source) => {
            text += `    ${source.name}: ${skipNotation ? source.value : notateNumber(source.value, valueNotation)}\n`
          })
        })
      }

      text += "\n"
    })
    
    navigator.clipboard.writeText(text)
    setShowFeedback(true)
    setFeedbackMessage("Copied text to clipboard")
  }

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    const filteredCategories = data.categories
      .map((category) => {
        const categoryMatches = category.name.toLowerCase().includes(query)

        const filteredSources = category.sources?.filter((source) => source.name.toLowerCase().includes(query))

        const filteredSubSections = category.subSections
          ?.map((subSection) => {
            const subSectionMatches = subSection.name.toLowerCase().includes(query)
            const filteredSubSources = subSection.sources.filter((source) => source.name.toLowerCase().includes(query))

            if (subSectionMatches || filteredSubSources.length > 0) {
              return {
                ...subSection,
                sources: subSectionMatches ? subSection.sources : filteredSubSources,
              }
            }
            return null
          })
          .filter(Boolean) as SubSection[]

        if (
          categoryMatches ||
          (filteredSources && filteredSources.length > 0) ||
          (filteredSubSections && filteredSubSections.length > 0)
        ) {
          return {
            ...category,
            sources: categoryMatches ? category.sources : filteredSources,
            subSections: categoryMatches ? category.subSections : filteredSubSections,
          }
        }
        return null
      })
      .filter(Boolean) as StatCategory[]

    return {
      ...data,
      categories: filteredCategories,
    }
  }, [data, searchQuery])

  const sortSources = (sources: StatSource[], prefix: string) => {
    if (!sources) return [];
    return [...sources].sort((a, b) => {
      const aKey = `${prefix}-${a.name}`
      const bKey = `${prefix}-${b.name}`
      const aPinned = pinnedSources.has(aKey)
      const bPinned = pinnedSources.has(bKey)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      return 0
    })
  }

  const sortedData = {
    ...filteredData,
    categories: filteredData.categories.map((category, catIdx) => ({
      ...category,
      sources: category.sources ? sortSources(category.sources, `${catIdx}`) : undefined,
      subSections: category.subSections?.map((subSection, subIdx) => ({
        ...subSection,
        sources: sortSources(subSection.sources, `${catIdx}-${subIdx}`),
      })),
    })),
  }

  const togglePin = (sourceKey: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setPinnedSources((prev) => {
      const next = new Set(prev)
      if (next.has(sourceKey)) {
        next.delete(sourceKey)
      } else {
        next.add(sourceKey)
      }
      return next
    })
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  return (
    <>
      <Box component="span" sx={{ display: "inline-block", cursor: "pointer" }} onClick={handleClick}>
        {children}
      </Box>

      <SwipeableDrawer
        anchor={isMobile ? "bottom" : "right"}
        open={open}
        onClose={handleClose}
        onOpen={handleClick}
        disableSwipeToOpen={false}
        swipeAreaWidth={20}
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                pt: 1,
                pb: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 4,
                  bgcolor: "divider",
                  borderRadius: 2,
                }}
              />
            </Box>
          )}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
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
              <Typography variant="h5" fontWeight={700}>
                {data.totalValue}
              </Typography>
            </Stack>
          </Stack>

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
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <IconButtonWithTooltip tooltip="Expand All" onClick={handleExpandAll}>
              <UnfoldMoreIcon fontSize="small" />
            </IconButtonWithTooltip>
            <IconButtonWithTooltip tooltip="Collapse All" onClick={handleCollapseAll}>
              <UnfoldLessIcon fontSize="small" />
            </IconButtonWithTooltip>
            <IconButtonWithTooltip tooltip="Copy as Text" onClick={handleCopyBreakdown}>
              <ContentCopyIcon fontSize="small" />
            </IconButtonWithTooltip>
            <IconButtonWithTooltip tooltip="Copy as Image" onClick={copyImageToClipboard}>
              <ImageIcon fontSize="small" />
            </IconButtonWithTooltip>
          </Stack>

          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              py: 1,
            }}
          >
            {sortedData.categories.map((category, idx) => {
              const isExpanded = expandedCategories.has(idx)
              const itemCount =
                (category.sources?.length || 0) +
                (category.subSections?.reduce((sum, sub) => sum + sub.sources.length, 0) || 0)

              return (
                <Box
                  key={idx}
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderBottom: 0 },
                  }}
                >
                  <Box
                    component="button"
                    onClick={(e) => toggleCategory(idx, e)}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: isMobile ? 2 : 3,
                      py: isMobile ? 1.75 : 1.5,
                      minHeight: isMobile ? 48 : "auto",
                      bgcolor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "white",
                      transition: "background-color 0.2s",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ChevronRightIcon
                        sx={{
                          fontSize: 20,
                          color: "text.secondary",
                          transition: "transform 0.2s",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {category.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {itemCount} sources
                    </Typography>
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box sx={{ pb: 1 }}>
                      {category.sources && category.sources.length > 0 && (
                        <Box>
                          {category.sources.map((source, sourceIdx) => {
                            const sourceKey = `${idx}-${source.name}`
                            const isPinned = pinnedSources.has(sourceKey)

                            return (
                              <Box
                                key={sourceIdx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  px: isMobile ? 3 : 5,
                                  py: isMobile ? 1.25 : 1,
                                  minHeight: isMobile ? 44 : "auto",
                                  transition: "background-color 0.2s",
                                  bgcolor: isPinned ? "rgba(255, 215, 0, 0.1)" : "transparent",
                                  "&:hover": {
                                    bgcolor: isPinned ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                  },
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => togglePin(sourceKey, e)}
                                    sx={{
                                      p: 0.5,
                                      color: isPinned ? "#FFD700" : "text.secondary",
                                      opacity: isPinned ? 1 : 0.3,
                                      transition: "opacity 0.2s, color 0.2s",
                                      "&:hover": {
                                        opacity: 1,
                                        bgcolor: "transparent",
                                      },
                                    }}
                                  >
                                    {isPinned ? (
                                      <StarIcon sx={{ fontSize: 16 }} />
                                    ) : (
                                      <StarBorderIcon sx={{ fontSize: 16 }} />
                                    )}
                                  </IconButton>
                                  <Typography variant="body2" color="text.primary" sx={{ opacity: 0.8 }}>
                                    {source.name}
                                  </Typography>
                                </Box>
                                <Typography variant="body2">{skipNotation ? source.value : notateNumber(source.value, valueNotation)}</Typography>
                              </Box>
                            )
                          })}
                        </Box>
                      )}

                      {category.subSections?.map((subSection, subIdx) => {
                        const subSectionKey = `${idx}-${subIdx}`
                        const isSubExpanded = expandedSubSections.has(subSectionKey)

                        return (
                          <Box key={subIdx} sx={{ mt: 0.5 }}>
                            <Box
                              component="button"
                              onClick={(e) => toggleSubSection(idx, subIdx, e)}
                              sx={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                px: isMobile ? 3 : 5,
                                py: isMobile ? 1.25 : 1,
                                minHeight: isMobile ? 44 : "auto",
                                bgcolor: "rgba(255, 255, 255, 0.03)",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background-color 0.2s",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.08)",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <ChevronRightIcon
                                  sx={{
                                    fontSize: 16,
                                    color: "text.secondary",
                                    transition: "transform 0.2s",
                                    transform: isSubExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  fontWeight={500}
                                  textTransform="uppercase"
                                  letterSpacing={0.5}
                                  color="text.secondary"
                                >
                                  {subSection.name}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.7 }}>
                                {subSection.sources.length}
                              </Typography>
                            </Box>

                            <Collapse in={isSubExpanded}>
                              <Box>
                                {subSection.sources.map((source, sourceIdx) => {
                                  const sourceKey = `${idx}-${subIdx}-${source.name}`
                                  const isPinned = pinnedSources.has(sourceKey)

                                  return (
                                    <Box
                                      key={sourceIdx}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        px: isMobile ? 4 : 6,
                                        py: isMobile ? 1.25 : 1,
                                        minHeight: isMobile ? 44 : "auto",
                                        transition: "background-color 0.2s",
                                        bgcolor: isPinned ? "rgba(255, 215, 0, 0.1)" : "transparent",
                                        "&:hover": {
                                          bgcolor: isPinned ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                        },
                                      }}
                                    >
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => togglePin(sourceKey, e)}
                                          sx={{
                                            p: 0.5,
                                            color: isPinned ? "#FFD700" : "text.secondary",
                                            opacity: isPinned ? 1 : 0.3,
                                            transition: "opacity 0.2s, color 0.2s",
                                            "&:hover": {
                                              opacity: 1,
                                              bgcolor: "transparent",
                                            },
                                          }}
                                        >
                                          {isPinned ? (
                                            <StarIcon sx={{ fontSize: 16 }} />
                                          ) : (
                                            <StarBorderIcon sx={{ fontSize: 16 }} />
                                          )}
                                        </IconButton>
                                        <Typography variant="body2" color="text.primary" sx={{ opacity: 0.8 }}>
                                          {source.name}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2">{skipNotation ? source.value : notateNumber(source.value, valueNotation)}</Typography>
                                    </Box>
                                  )
                                })}
                              </Box>
                            </Collapse>
                          </Box>
                        )
                      })}
                    </Box>
                  </Collapse>
                </Box>
              )
            })}
          </Box>
        </Box>
      </SwipeableDrawer>

      <Snackbar
        open={showFeedback}
        autoHideDuration={2000}
        onClose={() => setShowFeedback(false)}
        message={feedbackMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  )
}

const IconButtonWithTooltip = ({ children, tooltip, onClick }: { children: React.ReactNode, tooltip: string, onClick: () => void }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Tooltip title={tooltip} >
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