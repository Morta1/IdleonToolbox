import { copyBlob } from '@utility/clipboard';
import { useState } from 'react';
import useFormatDate from '@hooks/useFormatDate';
import { SHARE_IMAGE } from '@utility/colorSets';

// Draws a breakdown as an image: { statName, totalValue, rows } where rows come from
// breakdownView's flattenView (name, display, depth, children for groups), plus shareText
// for the drawer's % column (empty when hidden or not applicable).
const useBreakdown = () => {
  const formatDate = useFormatDate();
  const [isExporting, setIsExporting] = useState(false);

  const canvasToBlob = async (canvas, type = 'image/png', quality) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        type,
        quality
      )
    })
  }

  const generateImage = async ({ statName, totalValue, rows }) => {
    setIsExporting(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      throw new Error('Canvas 2d context unavailable');
    }

    const width = 500;
    const padding = 40;
    const lineHeight = 24;
    const groupHeight = 32;
    const indentStep = 16;
    const headerHeight = 140;
    const footerHeight = 50;
    // Room for the % column, left out when no row has a share
    const shareWidth = rows.some((row) => row.shareText) ? 64 : 0;
    const valueRight = width - padding - shareWidth;

    canvas.width = width;
    canvas.height = headerHeight + 24
      + rows.reduce((total, row) => total + (row.children ? groupHeight : lineHeight), 0)
      + 24 + footerHeight;

    ctx.fillStyle = SHARE_IMAGE.page;
    ctx.fillRect(0, 0, width, canvas.height);
    ctx.strokeStyle = SHARE_IMAGE.edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, canvas.height - 1);

    ctx.fillStyle = SHARE_IMAGE.card;
    ctx.fillRect(0, 0, width, headerHeight);
    ctx.beginPath();
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(width, headerHeight);
    ctx.stroke();

    ctx.fillStyle = SHARE_IMAGE.title;
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(statName, padding, padding + 20);

    ctx.font = '700 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = SHARE_IMAGE.total;
    ctx.fillText(String(totalValue), padding, padding + 70);

    let yPos = headerHeight + 24 + 16;
    const drawShare = (row) => {
      if (!row.shareText) return;
      ctx.fillStyle = SHARE_IMAGE.share;
      ctx.font = '400 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(row.shareText, width - padding - ctx.measureText(row.shareText).width, yPos);
    };
    rows.forEach((row) => {
      const x = padding + row.depth * indentStep;
      if (row.children) {
        // Group header: name, then its combined value in the accent color
        ctx.fillStyle = row.depth === 0 ? SHARE_IMAGE.groupFill : SHARE_IMAGE.subgroupFill;
        ctx.fillRect(x - 8, yPos - 20, width - x - padding + 16, groupHeight - 4);
        ctx.fillStyle = row.depth === 0 ? SHARE_IMAGE.group : SHARE_IMAGE.subgroup;
        ctx.font = `600 ${row.depth === 0 ? 17 : 14}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(row.name, x, yPos);
        ctx.font = '600 14px system-ui, -apple-system, sans-serif';
        const valueWidth = ctx.measureText(row.display).width;
        ctx.fillText(row.display, valueRight - valueWidth, yPos);
        drawShare(row);
        yPos += groupHeight;
        return;
      }
      ctx.fillStyle = row.inactive ? SHARE_IMAGE.inactive : SHARE_IMAGE.name;
      ctx.font = '400 15px system-ui, -apple-system, sans-serif';
      ctx.fillText(`• ${row.name}`, x, yPos);
      ctx.fillStyle = row.inactive ? SHARE_IMAGE.inactive : SHARE_IMAGE.value;
      ctx.font = '500 15px system-ui, -apple-system, sans-serif';
      const valueWidth = ctx.measureText(row.display).width;
      ctx.fillText(row.display, valueRight - valueWidth, yPos);
      drawShare(row);
      yPos += lineHeight;
    });

    // Footer
    ctx.fillStyle = SHARE_IMAGE.card;
    ctx.fillRect(0, canvas.height - footerHeight, width, footerHeight);
    ctx.strokeStyle = SHARE_IMAGE.edge;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - footerHeight);
    ctx.lineTo(width, canvas.height - footerHeight);
    ctx.stroke();
    ctx.fillStyle = SHARE_IMAGE.footer;
    ctx.font = '400 12px system-ui, -apple-system, sans-serif';
    const footerText = formatDate(new Date(), { showSeconds: false });
    const footerWidth = ctx.measureText(footerText).width;
    ctx.fillText(footerText, (width - footerWidth) / 2, canvas.height - footerHeight / 2 + 4);

    try {
      return await canvasToBlob(canvas)
    } finally {
      setIsExporting(false)
    }
  };

  const copyImageToClipboard = async (image) => {
    try {
      const blob = await generateImage(image);
      return await copyBlob(blob);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  return {
    copyImageToClipboard,
    isExporting
  }
}

export default useBreakdown;
