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

        const scaleX = canvas.width / 1920;
        const scaleY = canvas.height / 1080;

        currentCanvasObjects.forEach(obj => {
            const toolType = obj.tool || obj.type || obj.tool_name;

            if (toolType === 'InfoBox') {
                renderInfoBox(obj, scaleX, scaleY);
            } else if (toolType === 'LineGraph') {
                renderLineGraph(obj, scaleX, scaleY);
            } else if (toolType === 'DrawRectangle') {
                renderDrawRectangle(obj, scaleX, scaleY);
            } else if (toolType === 'DrawCircle') {
                renderDrawCircle(obj, scaleX, scaleY);
            } else if (toolType === 'DrawLine') {
                renderDrawLine(obj, scaleX, scaleY);
            } else if (toolType === 'DrawAscii') {
                renderDrawAscii(obj, scaleX, scaleY);
            }
        });
    }

    function renderInfoBox(obj, scaleX, scaleY) {
        const props = { x: obj.x * scaleX, y: obj.y * scaleY, width: obj.width * scaleX, height: obj.height * scaleY };
        const data = obj.data || obj.text || obj.content || {};
        const padding = 15;
        const lineHeight = 22;
        const futuristicBlue = '#4dc3ff';
        ctx.strokeStyle = futuristicBlue;
        ctx.strokeRect(props.x, props.y, props.width, props.height);
        ctx.fillStyle = futuristicBlue;
        ctx.font = '16px Courier New';
        const contentX = props.x + padding;
        const contentY = props.y + padding;
        const maxWidth = props.width - (padding * 2);
        if (typeof data === 'string') {
            wrapText(ctx, data, contentX, contentY, maxWidth, lineHeight);
        } else if (typeof data === 'object' && data !== null) {
            let currentY = contentY;
            for (const [key, value] of Object.entries(data)) {
                wrapText(ctx, `${key}: ${value}`, contentX, currentY, maxWidth, lineHeight);
                currentY += lineHeight * 2;
            }
        }
    }

    function renderLineGraph(obj, scaleX, scaleY) {
        const futuristicBlue = '#4dc3ff';
        const props = { x: obj.x * scaleX, y: obj.y * scaleY, width: obj.width * scaleX, height: obj.height * scaleY, label: obj.label || 'Line Graph' };
        const graphData = obj.data || [];

        ctx.strokeStyle = futuristicBlue;
        ctx.strokeRect(props.x, props.y, props.width, props.height);
        ctx.fillStyle = futuristicBlue;
        ctx.font = 'bold 16px Courier New';
        ctx.fillText(props.label, props.x + 10, props.y + 25);

        if (graphData.length === 0) return;

        let xValues = [];
        let yValues = [];
        if (Array.isArray(graphData[0])) {
            xValues = graphData.map(p => p[0]);
            yValues = graphData.map(p => p[1]);
        } else if (typeof graphData[0] === 'object' && graphData[0] !== null) {
            xValues = graphData.map(p => p.x);
            yValues = graphData.map(p => p.y);
        }

        if (yValues.length === 0) return;

        ctx.strokeStyle = '#00aaff';
        ctx.beginPath();
        const maxVal = Math.max(...yValues);
        const minVal = Math.min(...yValues);
        const xMax = Math.max(...xValues);
        const xMin = Math.min(...xValues);
        const xRange = xMax - xMin;

        graphData.forEach((point, index) => {
            const plotX = props.x + 10 + (((xValues[index] - xMin) / xRange) * (props.width - 20));
            const plotY = props.y + props.height - 10 - (((yValues[index] - minVal) / (maxVal - minVal)) * (props.height - 40));
            if (index === 0) ctx.moveTo(plotX, plotY); else ctx.lineTo(plotX, plotY);
        });
        ctx.stroke();
    }

    function renderDrawRectangle(obj, scaleX, scaleY) {
        const color = obj.color || '#4dc3ff';
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(77, 195, 255, 0.3)';
        const x = obj.x * scaleX, y = obj.y * scaleY, width = obj.width * scaleX, height = obj.height * scaleY;
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
    }

    function renderDrawCircle(obj, scaleX, scaleY) {
        const color = obj.color || '#4dc3ff';
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(77, 195, 255, 0.3)';
        const centerX = obj.center_x * scaleX, centerY = obj.center_y * scaleY, radius = obj.radius * scaleX;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    function renderDrawLine(obj, scaleX, scaleY) {
        ctx.strokeStyle = obj.color || '#4dc3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obj.start_x * scaleX, obj.start_y * scaleY);
        ctx.lineTo(obj.end_x * scaleX, obj.end_y * scaleY);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    function renderDrawAscii(obj, scaleX, scaleY) {
        const color = obj.color || '#4dc3ff';
        const x = obj.x * scaleX;
        const y = obj.y * scaleY;
        const fontSize = (obj.font_size || 16) * Math.min(scaleX, scaleY); 
        const lineHeight = fontSize * 1.2; 

        ctx.fillStyle = color;
        ctx.font = `${fontSize}px 'Courier New', Courier, monospace`; 

        const lines = obj.text_content.split('\n');
        let currentY = y;
        for (const line of lines) {
            ctx.fillText(line, x, currentY);
            currentY += lineHeight;
        }
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
                body: JSON.stringify({ prompt: userPrompt, current_objects: currentCanvasObjects }),
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
