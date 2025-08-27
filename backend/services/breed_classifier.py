# services/breed_classifier.py
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image

# Load a pretrained ResNet model
_model = models.resnet18(pretrained=True)
_model.eval()

# Transform for images
_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# Load ImageNet class labels
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
CLASSES_FILE = os.path.join(BASE_DIR, "assets", "imagenet_classes.txt")

with open(CLASSES_FILE) as f:
    IMAGENET_CLASSES = [line.strip() for line in f.readlines()]

def predict_breed(image_input):
    """Predict the breed (or closest class) of a dog image with confidence score.
       Accepts either a file path or a PIL.Image object.
    """
    # Handle both file path and PIL Image
    if isinstance(image_input, str):
        img = Image.open(image_input).convert("RGB")
    else:
        img = image_input.convert("RGB")

    img_t = _transform(img).unsqueeze(0)

    with torch.no_grad():
        outputs = _model(img_t)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        conf, predicted = torch.max(probabilities, 0)

    label = IMAGENET_CLASSES[predicted.item()]
    confidence = conf.item()

    return label, confidence

