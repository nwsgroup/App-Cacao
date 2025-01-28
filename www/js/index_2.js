import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

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

    status.textContent = "Loading model...";

    //const detector = await pipeline("object-detection", "CristianR8/Cacao-detection");
    const detector = await pipeline("object-detection", "Xenova/yolos-tiny");
    status.textContent = "Ready";

    
    function drawCanvasWithDetections(img, detections) {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;    
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scaleX = img.naturalWidth / img.width; 
        const scaleY = img.naturalHeight / img.height;

        ctx.font = "16px Arial";
        ctx.textBaseline = "top";
        ctx.lineWidth = 2;

        detections.forEach(detection => {
            const { xmin, ymin, xmax, ymax } = detection.box;

            const scaledX = xmin * scaleX;
            const scaledY = ymin * scaleY;
            const scaledW = (xmax - xmin) * scaleX;
            const scaledH = (ymax - ymin) * scaleY;

            ctx.strokeStyle = "lime"; // or "rgba(0, 255, 0, 1)"
            ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

            const label = `${detection.label} ${Math.round(detection.score * 100)}%`;
            const textWidth = ctx.measureText(label).width;
            const textHeight = 16; // approximate line height

            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(scaledX, scaledY - textHeight, textWidth, textHeight);

            ctx.fillStyle = "#000";
            ctx.fillText(label, scaledX, scaledY - textHeight);
        });

        return canvas.toDataURL("image/png");
    }

    
    async function detect(img) {
        status.innerHTML = `
            <div class="spinner">
            <div class="spinner-block first"></div>
            <div class="spinner-block second"></div>
            </div>
        `;
        try {
            const detections = await detector(img.src, { threshold: 0.5 });
            console.log("Detections:", detections);

            status.textContent = `Detected ${detections.length} objects`;

            const dataURL = drawCanvasWithDetections(img, detections);

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

            hiddenImage.onload = () => detect(hiddenImage);
        };
        reader.readAsDataURL(file);
    });

    
    resetButton.addEventListener("click", () => {
        if (detectionImage) {
            detectionImage.remove();
            detectionImage = null;
        }
        fileUpload.value = "";
        status.textContent = "Ready";
        uploadButton.style.display = "inline-block";
    });

    
    container.addEventListener("click", () => {
        fileUpload.click();
    });
});
