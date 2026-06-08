"""
download_images.py — скачивает тестовые фото для проекта
Запускать из папки dveri-rf:  python download_images.py
Требует: pip install requests
"""

import os
import urllib.request

# Создаём папку images
os.makedirs('images', exist_ok=True)

# Фото с Unsplash (бесплатные, без регистрации, маленький размер)
# Ключ ?w=400 = ширина 400px, q=80 = качество
ФОТО = {
    # Межкомнатные двери (id 1-8) — светлые деревянные
    'p1.jpg':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p2.jpg':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p3.jpg':  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=75',
    'p4.jpg':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p5.jpg':  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=75',
    'p6.jpg':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p7.jpg':  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=75',
    'p8.jpg':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',

    # Входные двери (id 9-16) — тёмные металлические
    'p9.jpg':  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p10.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p11.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p12.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p13.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p14.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p15.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p16.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',

    # Фурнитура (id 17-32) — ручки, замки
    'p17.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p18.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p19.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p20.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p21.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p22.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p23.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p24.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p25.jpg': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=75',
    'p26.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p27.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p28.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p29.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p30.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=75',
    'p31.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    'p32.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',

    # Слайдер
    'slide1.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=75',
    'slide2.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=75',
    'slide3.jpg': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=75',
    'slide4.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=75',
    'slide5.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=75',
    'slide6.jpg': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=75',

    # О компании
    'about1.jpg': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=75',
    'about2.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=75',
}

print(f"Скачиваю {len(ФОТО)} фото...\n")
ошибки = []

for имя, url in ФОТО.items():
    путь = os.path.join('images', имя)
    if os.path.exists(путь):
        print(f"  ✓ {имя} — уже есть, пропускаю")
        continue
    try:
        print(f"  ↓ {имя}...", end='', flush=True)
        urllib.request.urlretrieve(url, путь)
        размер = os.path.getsize(путь)
        print(f" {размер // 1024} KB ✓")
    except Exception as e:
        print(f" ОШИБКА: {e}")
        ошибки.append(имя)

print(f"\n{'='*50}")
if ошибки:
    print(f"Не скачалось: {', '.join(ошибки)}")
    print("Скачай их вручную с unsplash.com")
else:
    print(f"Готово! Все {len(ФОТО)} фото скачаны в папку images/")
    print("\nТеперь открой index.html через Live Server — фото должны отображаться!")
