import sys
from PIL import ImageGrab

if len(sys.argv) == 6:
    x1 = int(sys.argv[1])
    y1 = int(sys.argv[2])

    x2 = int(sys.argv[3])
    y2 = int(sys.argv[4])
    path = sys.argv[5]

    screenshot = ImageGrab.grab(bbox=(x1, y1, x2, y2))

    screenshot.save(path)
