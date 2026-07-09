# Dashboard de Portafolios de Inversión

Este proyecto corresponde al desarrollo de una aplicación web para calcular y visualizar la evolución de portafolios de inversión a partir de información histórica de precios.

La solución fue desarrollada utilizando Django y Django REST Framework para la API, y HTML, CSS, JavaScript y Chart.js para la interfaz gráfica.

## Tecnologías utilizadas

- Python 3
- Django
- Django REST Framework
- SQLite
- Pandas
- OpenPyXL
- HTML
- CSS
- JavaScript
- Chart.js
- Bootstrap 5

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/portafolio-abaqus.git

cd portafolio-abaqus
```

### 2. Crear un entorno virtual

Windows

```bash
python -m venv venv

venv\Scripts\activate
```

Linux/macOS

```bash
python3 -m venv venv

source venv/bin/activate
```

### 3. Instalar las dependencias

```bash
pip install -r requirements.txt
```

### 4. Aplicar las migraciones

```bash
python manage.py migrate
```

### 5. Ejecutar el servidor

```bash
python manage.py runserver
```

La aplicación estará disponible en:

```
http://127.0.0.1:8000/api/dashboard/
```

## Endpoints

### Dashboard

```
/api/dashboard/
```

### API del portafolio

```
/api/portafolio/
```

Ejemplo:

```
/api/portafolio/?portafolio=1&fecha_inicio=2022-02-15&fecha_fin=2023-02-16
```

### API de inversiones

```
/api/inversiones/
```

## Estructura del proyecto

```
PortafolioAbaqus/

├── inversiones/
├── portafolio/
├── manage.py
├── requirements.txt
├── build.sh
├── db.sqlite3
└── README.md
```

## Descripción

La aplicación permite seleccionar un portafolio y un rango de fechas para consultar su comportamiento histórico.

El sistema calcula automáticamente:

- Valor diario del portafolio.
- Peso relativo de cada activo.
- Valor inicial.
- Valor final.
- Rentabilidad del período.

Los resultados se presentan mediante un dashboard que incluye un gráfico de línea para la evolución del valor del portafolio y un gráfico de áreas apiladas (stacked area) para visualizar la composición de los activos.

## Autor

Nidia Antonella Bugueño Rodríguez
