import { AutoModel, AutoProcessor, RawImage, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowRemoteModels = true;
env.allowLocalModels = false;

document.addEventListener("DOMContentLoaded", async () => {
    const imageContainer = document.querySelector(".custom-file-upload");
    const status = document.getElementById("status");
    const fileUpload = document.getElementById("upload");
    const resetButton = document.getElementById("reset-image");
    const uploadButton = document.getElementById("upload-btn");
    const container = document.querySelector(".custom-file-upload");

    let detectionImage = null;
    let model = null;
    let processor = null;

    status.textContent = "Loading model...";

    try {
        model = await AutoModel.from_pretrained(
            "Factral/prob8",
            {
                quantized: false,
            }
        );
        processor = await AutoProcessor.from_pretrained("Factral/prob8");
        status.textContent = "Listo";
    } catch (error) {
        console.error("Model loading error:", error);
        status.textContent = "Error loading model";
        return;
    }

    function drawCanvasWithDetections(img, detections) {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let fontSize = Math.floor(canvas.width * 0.03);
        if (fontSize < 20) fontSize = 20;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textBaseline = "top";
        ctx.lineWidth = 20;

        detections.forEach(detection => {
            const { x1, y1, x2, y2, label, score } = detection;

            ctx.strokeStyle = "rgba(0, 255, 0, 1)";
            ctx.setLineDash([8, 4]); 
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.setLineDash([]); 

            const labelText = `${label} ${Math.round(score * 100)}%`;
            const textWidth = ctx.measureText(labelText).width;
            const textHeight = 16;

            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(x1, y1 - textHeight, textWidth, textHeight);

            ctx.fillStyle = "#fff";
            ctx.fillText(labelText, x1, y1 - textHeight);
        });

        return canvas.toDataURL("image/png");
    }

    function removeDuplicates(detections, iouThreshold) {
        const filteredDetections = [];
        for (const detection of detections) {
            let isDuplicate = false;
            let duplicateIndex = -1;
            let maxIoU = 0;
            for (let i = 0; i < filteredDetections.length; i++) {
                const filteredDetection = filteredDetections[i];
                const iou = calculateIoU(detection, filteredDetection);
                if (iou > iouThreshold) {
                    isDuplicate = true;
                    if (iou > maxIoU) {
                        maxIoU = iou;
                        duplicateIndex = i;
                    }
                }
            }
            if (!isDuplicate) {
                filteredDetections.push(detection);
            } else if (duplicateIndex !== -1) {
                if (detection.score > filteredDetections[duplicateIndex].score) {
                    filteredDetections[duplicateIndex] = detection;
                }
            }
        }
        return filteredDetections;
    }

    function calculateIoU(detection1, detection2) {
        const xOverlap = Math.max(0, Math.min(detection1.x2, detection2.x2) - Math.max(detection1.x1, detection2.x1));
        const yOverlap = Math.max(0, Math.min(detection1.y2, detection2.y2) - Math.max(detection1.y1, detection2.y1));
        const overlapArea = xOverlap * yOverlap;
        const area1 = (detection1.x2 - detection1.x1) * (detection1.y2 - detection1.y1);
        const area2 = (detection2.x2 - detection2.x1) * (detection2.y2 - detection2.y1);
        const unionArea = area1 + area2 - overlapArea;
        return overlapArea / unionArea;
    }

    async function detect(img) {
        status.innerHTML = `
            <div class="spinner">
            <div class="spinner-block first"></div>
            <div class="spinner-block second"></div>
            </div>
        `;

        try {
            // Convert the image to RawImage format
            const rawImage = await RawImage.fromBlob(await fetch(img.src).then(r => r.blob()));
            
            // Process the image
            const { pixel_values } = await processor(rawImage);
            
            // Get model output
            const output = await model({ images: pixel_values });
            
            // Post-process the output
            const permuted = output.output0[0].transpose(1, 0);
            
            const results = [];
            const threshold = 0.5;
            const [scaledHeight, scaledWidth] = pixel_values.dims.slice(-2);

            for (const [xc, yc, w, h, ...scores] of permuted.tolist()) {
                // Get pixel values, taking into account the original image size
                const x1 = (xc - w/2) / scaledWidth * rawImage.width;
                const y1 = (yc - h/2) / scaledHeight * rawImage.height;
                const x2 = (xc + w/2) / scaledWidth * rawImage.width;
                const y2 = (yc + h/2) / scaledHeight * rawImage.height;
                
                // Get best class
                const argmax = scores.reduce((maxIndex, currentVal, currentIndex, arr) => 
                    currentVal > arr[maxIndex] ? currentIndex : maxIndex, 0);
                const score = scores[argmax];
                
                if (score < threshold) continue;
                
                const label = model.config.id2label[argmax];
                results.push({
                    x1, x2, y1, y2, score, label, index: argmax,
                });
            }

            // Remove duplicate detections
            const iouThreshold = 0.5;
            const filteredResults = removeDuplicates(results, iouThreshold);

            status.textContent = `Se han detectado ${filteredResults.length} elementos`;

            // Draw the detections
            const dataURL = drawCanvasWithDetections(img, filteredResults);

            if (detectionImage) {
                detectionImage.remove();
            }

            detectionImage = document.createElement("img");
            detectionImage.src = dataURL;
            detectionImage.style.maxWidth = "100%";
            detectionImage.style.height = "auto";
            detectionImage.id = "detectionImage";

            imageContainer.appendChild(detectionImage);

        } catch (error) {
            console.error("Detection error:", error);
            status.textContent = "Error during detection";
        }
    }

    fileUpload.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e2) {
            uploadButton.style.display = "none";

            const hiddenImage = document.createElement("img");
            hiddenImage.src = e2.target.result;

            hiddenImage.onload = () => {
                const detectionImage = document.createElement("img");
                const container = document.querySelector(".container");

                detectionImage.src = hiddenImage.src;
                detectionImage.style.width = "100%"; 
                detectionImage.style.maxHeight = "80vh";
                detectionImage.style.objectFit = "contain";
                container.style.maxHeight = "none";
                container.style.height = "auto";
          
                detect(hiddenImage);
            };
        };
        reader.readAsDataURL(file);
    });

    resetButton.addEventListener("click", () => {
        if (detectionImage) {
            detectionImage.remove();
            detectionImage = null;
        }
        fileUpload.value = "";
        status.textContent = "Listo";
        uploadButton.style.display = "inline-block";
    });

    container.addEventListener("click", () => {
        fileUpload.click();
    });
});