# Face-API.js Models Download Instructions

## Required Models for Body Language Monitor

To use the Real-Time Body Language Analysis feature, you need to download the face-api.js models and place them in the `frontend/public/models/` directory.

## Download Links

### 1. Tiny Face Detector (Lightweight)
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

**Download:** https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### 2. Face Landmarks 68
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

**Download:** https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### 3. Face Expressions
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

**Download:** https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Installation Steps

### Option 1: Manual Download

1. Create the models directory:
   ```bash
   mkdir frontend/public/models
   ```

2. Download the model files from:
   ```
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   ```

3. Place all downloaded files in:
   ```
   frontend/public/models/
   ```

### Option 2: Direct Download (PowerShell)

Run this in your project root to download all required models:

```powershell
$modelsDir = "frontend\public\models"
New-Item -ItemType Directory -Force -Path $modelsDir

$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
)

foreach ($file in $files) {
    $output = Join-Path $modelsDir $file
    Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile $output
    Write-Host "Downloaded: $file"
}
```

## Verify Installation

After downloading, verify the models directory contains:

```
frontend/public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_expression_model-weights_manifest.json
└── face_expression_model-shard1
```

## Troubleshooting

### Models not loading
- Ensure all 6 files are present in the models directory
- Check browser console for loading errors
- Verify the models are served from the correct path (`/models/`)

### Camera not working
- Check browser permissions for camera access
- Ensure HTTPS is being used (camera requires secure context)
- Try using Chrome or Firefox

### Performance issues
- The component uses `TinyFaceDetector` for optimal performance
- Analysis runs every 200ms to reduce CPU usage
- Disable `showLandmarks` prop if experiencing lag
