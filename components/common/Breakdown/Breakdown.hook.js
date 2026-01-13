import { notateNumber } from '@utility/helpers';
import { useState } from 'react';

const useBreakdown = ({
                        data,
                        valueNotation = 'MultiplierInfo',
                        setFeedbackMessage,
                        setShowFeedback,
                        skipNotation
                      }) => {
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

  const generateImage = async () => {
    setIsExporting(true);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions - matching Material UI theme
    const width = 500;
    const padding = 40;
    const lineHeight = 24;
    const sectionSpacing = 16;
    const categorySpacing = 32;

    // Calculate height needed
    let estimatedHeight = 280; // Header + padding
    data.categories.forEach(cat => {
      estimatedHeight += 40; // Category header
      if (cat.sources) estimatedHeight += cat.sources.length * lineHeight;
      if (cat.subSections) {
        cat.subSections.forEach(sub => {
          estimatedHeight += 32 + (sub.sources.length * lineHeight);
        });
      }
      estimatedHeight += categorySpacing;
    });

    canvas.width = width;
    canvas.height = estimatedHeight;

    // Background - matching MUI theme background.default (#141A21)
    ctx.fillStyle = '#141A21';
    ctx.fillRect(0, 0, width, canvas.height);

    // Border - subtle like MUI cards
    ctx.strokeStyle = '#2f3641';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, canvas.height - 1);

    let yPos = padding;

    // Header section - matching MUI Card background (#1C252E)
    ctx.fillStyle = '#1C252E';
    ctx.fillRect(0, 0, width, 140);

    // Header border bottom
    ctx.strokeStyle = '#2f3641';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(width, 140);
    ctx.stroke();

    // Title - using default MUI text color
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.statName, padding, yPos + 20);

    // Total value - using MUI multi color (#2087e8) - positioned below title
    ctx.font = '700 38px system-ui, -apple-system, sans-serif';
    const totalText = data.totalValue;
    ctx.fillStyle = '#2087e8';
    ctx.fillText(totalText, padding, yPos + 70);

    yPos += 120 + categorySpacing;

    // Categories
    data.categories.forEach((category, catIdx) => {
      // Category header background - subtle like accordion
      ctx.fillStyle = 'rgba(28, 37, 46, 0.3)';
      ctx.fillRect(0, yPos - 24, width, 40);

      // Category name - using multi color
      ctx.fillStyle = '#2087e8';
      ctx.font = '600 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(category.name, padding, yPos);

      // Item count - muted text
      const itemCount = (category.sources?.length || 0) +
        (category.subSections?.reduce((sum, sub) => sum + sub.sources.length, 0) || 0);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '400 13px system-ui, -apple-system, sans-serif';
      const countText = `${itemCount} sources`;
      const countWidth = ctx.measureText(countText).width;
      ctx.fillText(countText, width - padding - countWidth, yPos);

      yPos += sectionSpacing;

      // Divider line
      ctx.strokeStyle = '#2f3641';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, yPos);
      ctx.lineTo(width - padding, yPos);
      ctx.stroke();

      yPos += sectionSpacing + 4;

      // Category sources
      if (category.sources) {
        category.sources.forEach(source => {
          // Source name
          ctx.fillStyle = 'rgba(255, 255, 255, 0.87)';
          ctx.font = '400 15px system-ui, -apple-system, sans-serif';
          ctx.fillText(`• ${source.name}`, padding + 16, yPos);

          // Source value
          const valueText = skipNotation ? source.value : notateNumber(source.value, valueNotation);
          const valueWidth = ctx.measureText(valueText).width;
          ctx.fillStyle = '#ffffff';
          ctx.font = '500 15px system-ui, -apple-system, sans-serif';
          ctx.fillText(valueText, width - padding - valueWidth, yPos);

          yPos += lineHeight;
        });
      }

      // Subsections
      if (category.subSections) {
        category.subSections.forEach(subSection => {
          // Subsection background - slightly elevated
          ctx.fillStyle = 'rgba(28, 37, 46, 0.4)';
          ctx.fillRect(padding + 12, yPos - 18, width - padding * 2 - 12, 30);

          // Subsection name
          ctx.fillStyle = '#94baee'; // multiLight color
          ctx.font = '600 13px system-ui, -apple-system, sans-serif';
          ctx.fillText(subSection.name.toUpperCase(), padding + 20, yPos);

          // Subsection count
          const subCountText = `${subSection.sources.length}`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '400 12px system-ui, -apple-system, sans-serif';
          const subCountWidth = ctx.measureText(subCountText).width;
          ctx.fillText(subCountText, width - padding - subCountWidth, yPos);

          yPos += sectionSpacing + 8;

          subSection.sources.forEach(source => {
            // Nested source name
            ctx.fillStyle = 'rgba(255, 255, 255, 0.87)';
            ctx.font = '400 15px system-ui, -apple-system, sans-serif';
            ctx.fillText(`  • ${source.name}`, padding + 28, yPos);

            // Nested source value
            const valueText = skipNotation ? source.value : notateNumber(source.value, valueNotation);
            const valueWidth = ctx.measureText(valueText).width;
            ctx.fillStyle = '#ffffff';
            ctx.font = '500 15px system-ui, -apple-system, sans-serif';
            ctx.fillText(valueText, width - padding - valueWidth, yPos);

            yPos += lineHeight;
          });

          yPos += sectionSpacing / 2;
        });
      }

      yPos += categorySpacing;
    });

    // Footer section
    const footerHeight = 50;
    ctx.fillStyle = '#1C252E';
    ctx.fillRect(0, canvas.height - footerHeight, width, footerHeight);

    // Footer border top
    ctx.strokeStyle = '#2f3641';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - footerHeight);
    ctx.lineTo(width, canvas.height - footerHeight);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '400 12px system-ui, -apple-system, sans-serif';
    const footerText = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const footerWidth = ctx.measureText(footerText).width;
    ctx.fillText(footerText, (width - footerWidth) / 2, canvas.height - footerHeight / 2 + 4);

    try {
      const blob = await canvasToBlob(canvas)

      return blob
    } finally {
      setIsExporting(false)
    }
  };

  const copyImageToClipboard = async () => {
    const blob = await generateImage();
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard image API not supported')
    }

    const item = new ClipboardItem({
      [blob.type]: blob
    })

    await navigator.clipboard.write([item])
    setFeedbackMessage('Copied image to clipboard');
    setShowFeedback(true);
  }


  return {
    copyImageToClipboard,
    isExporting
  }
}

export default useBreakdown;