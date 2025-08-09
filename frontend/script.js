document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const form = document.getElementById('prompt-form');
    const input = document.getElementById('prompt-input');

    let currentCanvasObjects = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render();
    }

    // --- Text Wrapping Helper ---
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!currentCanvasObjects || currentCanvasObjects.length === 0) return;

        currentCanvasObjects.forEach(obj => {
            const scaleX = canvas.width / 1920;
            const scaleY = canvas.height / 1080;
            const props = {
                x: obj.x * scaleX,
                y: obj.y * scaleY,
                width: obj.width * scaleX,
                height: obj.height * scaleY,
                label: obj.label
            };
            const toolType = obj.tool || obj.type;

            if (toolType === 'InfoBox') {
                const infoData = obj.data || obj.text || obj.content || {};
                renderInfoBox(props, infoData);
            } else if (toolType === 'LineGraph') {
                renderLineGraph(props, obj.series_data);
            }
        });
    }

    function renderInfoBox(props, data) {
        const { x, y, width, height } = props;
        const padding = 15;
        const lineHeight = 22;
        const futuristicBlue = '#4dc3ff';

        // Draw the border, no fill
        ctx.strokeStyle = futuristicBlue;
        ctx.strokeRect(x, y, width, height);

        // Set font for content
        ctx.fillStyle = futuristicBlue;
        ctx.font = '16px Courier New';
        const contentX = x + padding;
        const contentY = y + padding;
        const maxWidth = width - (padding * 2);

        if (typeof data === 'string') {
            wrapText(ctx, data, contentX, contentY, maxWidth, lineHeight);
        } else if (typeof data === 'object' && data !== null) {
            let currentY = contentY;
            for (const [key, value] of Object.entries(data)) {
                wrapText(ctx, `${key}: ${value}`, contentX, currentY, maxWidth, lineHeight);
                currentY += lineHeight * 2; // Add extra space for key-value pairs
            }
        }
    }

    function renderLineGraph(props, seriesData) {
        const { x, y, width, height, label } = props;
        const futuristicBlue = '#4dc3ff';

        ctx.strokeStyle = futuristicBlue;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = futuristicBlue;
        ctx.font = 'bold 16px Courier New';
        ctx.fillText(label, x + 10, y + 25);
        
        ctx.strokeStyle = '#00aaff'; // A slightly different blue for the graph line itself
        ctx.beginPath();
        const maxVal = Math.max(...seriesData);
        seriesData.forEach((val, index) => {
            const plotX = x + (index / (seriesData.length - 1)) * (width - 20) + 10;
            const plotY = y + height - 20 - (val / maxVal) * (height - 40);
            if (index === 0) {
                ctx.moveTo(plotX, plotY);
            } else {
                ctx.lineTo(plotX, plotY);
            }
        });
        ctx.stroke();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const userPrompt = input.value.trim();
        if (!userPrompt) return;

        input.value = 'Processing...';
        input.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8000/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userPrompt,
                    current_objects: currentCanvasObjects,
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            currentCanvasObjects = data.canvas_objects || [];
            render();

        } catch (error) {
            console.error('Error fetching from backend:', error);
        } finally {
            input.value = '';
            input.disabled = false;
            input.focus();
        }
    }

    window.addEventListener('resize', resizeCanvas);
    form.addEventListener('submit', handleSubmit);
    resizeCanvas();
});
