/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
//env.allowLocalModels = false;
env.allowRemoteModels = false;

document.addEventListener("DOMContentLoaded", async () => {
    const imageContainer = document.querySelector(".custom-file-upload");
    const status = document.getElementById("status");
    const fileUpload = document.getElementById("upload");
    const resetButton = document.getElementById("reset-image");
    const uploadButton = document.getElementById("upload-btn");
    const container = document.querySelector(".custom-file-upload");

    status.textContent = "Loading model...";

    const classifier = await pipeline("image-classification", "CristianR8/test-detection");

    status.textContent = "Ready";

    async function detect(img) {
        status.innerHTML = `
            <div class="spinner">
            <div class="spinner-block first"></div>
            <div class="spinner-block second"></div>
            </div>
        `;
        const output = await classifier(img.src, { topk: 0 });
        console.log("output", output);
        status.textContent = "";
        console.log("output", output);
        status.innerHTML = `<strong>Prediction: ${output[0].label}</strong> <br> prob: ${output[0].score}`;
        // output[0].label;
      }

    fileUpload.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        };
        const reader = new FileReader();

        reader.onload = function (e2) {
            uploadButton.style.display = 'none';
            const image = document.createElement("img");
            image.src = e2.target.result;
            image.style.maxWidth = "100%"; 
            image.style.height = "100%";
            image.id = "inputImage"
            imageContainer.appendChild(image);
            detect(image);
        };
        reader.readAsDataURL(file);
    });

    resetButton.addEventListener("click", () => {
        const img = document.getElementById("inputImage")
        if(img){
            img.remove();
        }  
        fileUpload.value="";
        status.textContent = "Ready";  
        uploadButton.style.display='flex'; 
    });

    container.addEventListener('click', () => {
        fileUpload.click();
    });
});
