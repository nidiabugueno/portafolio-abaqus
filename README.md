# Dashboard de Portafolios de Inversión

Desarrollo de una aplicación web para el cálculo y visualización de portafolios de inversión utilizando Django, Django REST Framework y Chart.js.

Este proyecto fue desarrollado como solución a una prueba técnica cuyo objetivo era construir una API capaz de calcular el valor histórico de un portafolio y visualizar su evolución mediante un dashboard interactivo.

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
- Bootstrap 5
- Chart.js

## Instalación

### Clonar el repositorio

```bash
git clone https://github.com/nidiabugueno/portafolio-abaqus.git

cd portafolio-abaqus
```

### Crear un entorno virtual

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

### Instalar dependencias

```bash
pip install -r requirements.txt
```

### Aplicar las migraciones

```bash
python manage.py migrate
```

### Ejecutar el servidor

```bash
python manage.py runserver
```

La aplicación estará disponible en:

```
http://127.0.0.1:8000/api/dashboard/
```

## Endpoints

Dashboard

```
/api/dashboard/
```

API del portafolio

```
/api/portafolio/
```

Ejemplo:

```
/api/portafolio/?portafolio=1&fecha_inicio=2022-02-15&fecha_fin=2023-02-16
```

API de inversiones

```
/api/inversiones/
```

## Estructura del proyecto

```
PortafolioAbaqus/
│
├── inversiones/
├── portafolio/
├── manage.py
├── requirements.txt
├── build.sh
├── db.sqlite3
└── README.md
```

## Descripción

La aplicación permite consultar la evolución histórica de un portafolio de inversión dentro de un rango de fechas.

Para cada fecha, el sistema calcula automáticamente:

- Valor total del portafolio.
- Peso relativo de cada activo.
- Valor inicial.
- Valor final.
- Rentabilidad del período.

Los resultados se presentan mediante un dashboard que incluye un gráfico de línea para la evolución del valor del portafolio y un gráfico de áreas apiladas (stacked area) para representar la composición de los activos.

