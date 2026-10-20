# API request examples

## Identify a plant image
```bash
curl -X POST http://localhost:5000/api/identify \
  -F "image=@./plant.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Search the plant library
```bash
curl "http://localhost:5000/api/plants?q=tulsi&page=1&limit=20"
```

## Register / log in
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Example User","email":"user@example.com","password":"change-me-please"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"change-me-please"}'
```

## Create a plant (admin token required)
```bash
curl -X POST http://localhost:5000/api/admin/plants \
  -H 'Content-Type: application/json' -H 'Authorization: Bearer ADMIN_TOKEN' \
  -d '{"nameBn":"তুলসী","nameEn":"Holy Basil","scientificName":"Ocimum tenuiflorum","descriptionBn":"সুগন্ধি ভেষজ উদ্ভিদ","status":"published"}'
```
