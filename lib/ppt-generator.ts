import type { VideoAnalysisResult } from '@/types/video-analysis';

export async function generatePPT(topicTitle: string, data: VideoAnalysisResult) {
  // Dynamic import to avoid SSR/webpack bundling of node: modules
  const pptxgenModule = await import('pptxgenjs');
  const PptxGenJS = pptxgenModule.default;
  const pptx = new PptxGenJS();

  // Define Presentation Layout
  pptx.layout = 'LAYOUT_16x9';

  // ── Slide 1: Hero/Title Slide ──
  const slide1 = pptx.addSlide();
  slide1.background = { color: '090C16' };

  slide1.addText(topicTitle, {
    x: 0.5,
    y: 2.0,
    w: 9.0,
    h: 1.5,
    fontSize: 40,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Calibri',
  });

  slide1.addText('Course Curator AI - Automated Learning Syllabus', {
    x: 0.5,
    y: 3.5,
    w: 9.0,
    h: 0.5,
    fontSize: 16,
    color: '00FFFF',
    fontFace: 'Calibri',
  });

  slide1.addText('Curated presentation for educators and quick revision.', {
    x: 0.5,
    y: 4.2,
    w: 9.0,
    h: 0.5,
    fontSize: 12,
    color: '94A3B8',
    fontFace: 'Calibri',
  });

  // ── Slide 2: Key Concepts (Summary) ──
  const slide2 = pptx.addSlide();
  slide2.background = { color: '0F172A' };

  slide2.addText('Key Lecture Insights', {
    x: 0.5,
    y: 0.5,
    w: 9.0,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: 'A855F7',
    fontFace: 'Calibri',
  });

  data.summary.forEach((item, index) => {
    const yPos = 1.1 + index * 1.0;
    if (index < 5) {
      slide2.addText(`${item.emoji} ${item.heading}`, {
        x: 0.5,
        y: yPos,
        w: 9.0,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Calibri',
      });
      slide2.addText(item.detail, {
        x: 0.5,
        y: yPos + 0.3,
        w: 9.0,
        h: 0.5,
        fontSize: 11,
        color: '94A3B8',
        fontFace: 'Calibri',
      });
    }
  });

  // ── Slide 3: Concept Flowchart Steps ──
  if (data.flowchart && data.flowchart.nodes) {
    const slide3 = pptx.addSlide();
    slide3.background = { color: '0F172A' };

    slide3.addText('Workflow & Processes', {
      x: 0.5,
      y: 0.5,
      w: 9.0,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: '00FFFF',
      fontFace: 'Calibri',
    });

    const steps = data.flowchart.nodes.filter(n => n.type !== 'start' && n.type !== 'end');
    steps.forEach((node, index) => {
      if (index < 4) {
        const xPos = 0.5 + index * 2.3;
        slide3.addShape('rect' as any, {
          x: xPos,
          y: 2.2,
          w: 2.1,
          h: 2.2,
          fill: { color: '1E293B' },
          line: { color: '334155', width: 1 },
        });

        slide3.addText(`0${index + 1}`, {
          x: xPos + 0.2,
          y: 2.4,
          w: 1.7,
          h: 0.3,
          fontSize: 18,
          bold: true,
          color: '00FFFF',
          fontFace: 'Calibri',
        });

        slide3.addText(node.label, {
          x: xPos + 0.2,
          y: 2.8,
          w: 1.7,
          h: 1.4,
          fontSize: 12,
          color: 'FFFFFF',
          fontFace: 'Calibri',
        });
      }
    });
  }

  // ── Slide 4: Interactive Quiz Questions ──
  if (data.quiz && data.quiz.length > 0) {
    const slide4 = pptx.addSlide();
    slide4.background = { color: '0F172A' };

    slide4.addText('Quick Quiz & Evaluation', {
      x: 0.5,
      y: 0.5,
      w: 9.0,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: '22C55E',
      fontFace: 'Calibri',
    });

    data.quiz.forEach((q, index) => {
      if (index < 2) {
        const yPos = 1.3 + index * 2.3;
        slide4.addText(`Q${index + 1}: ${q.question}`, {
          x: 0.5,
          y: yPos,
          w: 9.0,
          h: 0.5,
          fontSize: 13,
          bold: true,
          color: 'FFFFFF',
          fontFace: 'Calibri',
        });

        q.options.forEach((opt, oIdx) => {
          const ox = 0.5 + (oIdx % 2) * 4.6;
          const oy = yPos + 0.5 + Math.floor(oIdx / 2) * 0.45;
          const isCorrect = oIdx === q.correctAnswerIndex;
          slide4.addText(`${String.fromCharCode(65 + oIdx)}) ${opt}`, {
            x: ox,
            y: oy,
            w: 4.3,
            h: 0.35,
            fontSize: 11,
            color: isCorrect ? '22C55E' : '94A3B8',
            bold: isCorrect,
            fontFace: 'Calibri',
          });
        });

        slide4.addText(`Explanation: ${q.explanation}`, {
          x: 0.5,
          y: yPos + 1.5,
          w: 9.0,
          h: 0.4,
          fontSize: 10,
          color: '64748B',
          italic: true,
          fontFace: 'Calibri',
        });
      }
    });
  }

  // Save presentation
  const safeTitle = topicTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  pptx.writeFile({ fileName: `course-curator-${safeTitle}.pptx` });
}
