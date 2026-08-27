# IndabaX Kabale — Registration

Students register on one short form. Organizers search the list and export CSV.

## Run

Create `backend/.env` from `backend/.env.example` and set `DATABASE_URL`.

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173
