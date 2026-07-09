// ==============================================================
// Dashboard de Portafolio — lógica de frontend
// Consume /api/portafolio/ y dibuja:
//   1) Gráfico de línea: valor_portafolio vs fecha
//   2) Gráfico stacked area: weights por activo (dinámico)
// No modifica nada del backend.
// ==============================================================

// Referencias a las instancias de Chart.js, para poder destruirlas
// antes de volver a dibujar y evitar que se apilen gráficos.
let graficoValor = null;
let graficoWeights = null;

// Se guarda la última respuesta válida de la API para poder
// redibujar los gráficos con los colores del tema nuevo al
// cambiar entre claro/oscuro, sin volver a golpear el backend.
let ultimosDatos = null;

// Paleta de colores para los activos. Si hay más activos que colores,
// se generan tonos adicionales rotando el matiz (HSL).
const PALETA_ACTIVOS = [
    "#3B82F6", // azul
    "#F59E0B", // ámbar
    "#22C55E", // verde
    "#EF4444", // rojo
    "#8B5CF6", // violeta
    "#06B6D4", // cian
    "#EC4899", // rosa
    "#14B8A6", // teal
    "#FB923C", // naranjo
    "#6366F1", // índigo
    "#EAB308", // amarillo
    "#F43F5E", // rosa fuerte
    "#0EA5E9", // celeste
    "#10B981", // esmeralda
    "#D946EF", // fucsia
    "#84CC16", // lima
    "#A855F7"  // púrpura
];

function colorParaIndice(indice) {
    if (indice < PALETA_ACTIVOS.length) {
        return PALETA_ACTIVOS[indice];
    }
    const matiz = (indice * 47) % 360;
    return `hsl(${matiz}, 65%, 55%)`;
}

function hexAAlphaRgba(hex, alpha) {
    if (hex.startsWith("hsl(")) {
        return hex.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Lee una variable CSS del tema activo, para que Chart.js (que pinta
// en <canvas>, fuera del alcance de las hojas de estilo) siempre use
// los mismos colores que el resto de la interfaz.
function leerVariableTema(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

// ==============================================================
// Referencias del DOM
// ==============================================================

const elPortafolio = document.getElementById("portafolio");
const elFechaInicio = document.getElementById("fecha_inicio");
const elFechaFin = document.getElementById("fecha_fin");
const elBotonConsultar = document.getElementById("consultar");

const elEstadoMensaje = document.getElementById("estadoMensaje");
const elEstadoMensajeTexto = document.getElementById("estadoMensajeTexto");

const elKpiValorInicial = document.getElementById("kpiValorInicial");
const elKpiValorFinal = document.getElementById("kpiValorFinal");
const elKpiRentabilidad = document.getElementById("kpiRentabilidad");
const elKpiActivos = document.getElementById("kpiActivos");

const elLeyendaActivos = document.getElementById("leyendaActivos");

const elResumenConsulta = document.getElementById("resumenConsulta");
const elResumenPortafolio = document.getElementById("resumenPortafolio");
const elResumenRango = document.getElementById("resumenRango");

const elDescargarValor = document.getElementById("descargarGraficoValor");
const elDescargarWeights = document.getElementById("descargarGraficoWeights");

const elToggleTema = document.getElementById("toggleTema");
const elFechaHoy = document.getElementById("fechaHoy");

elBotonConsultar.addEventListener("click", cargarDatos);
elDescargarValor.addEventListener("click", () => descargarGrafico(graficoValor, "valor-portafolio.png"));
elDescargarWeights.addEventListener("click", () => descargarGrafico(graficoWeights, "composicion-portafolio.png"));
elToggleTema.addEventListener("click", alternarTema);

window.addEventListener("load", () => {
    mostrarFechaHoy();
    // Carga automática con los valores por defecto de los filtros,
    // para que el dashboard nunca se vea vacío al abrir.
    cargarDatos();
});

// ==============================================================
// Tema claro / oscuro
// ==============================================================

function alternarTema() {
    const raiz = document.documentElement;
    const esOscuro = raiz.getAttribute("data-theme") === "dark";
    const nuevoTema = esOscuro ? "light" : "dark";

    raiz.setAttribute("data-theme", nuevoTema);

    try {
        localStorage.setItem("portafolio_tema", nuevoTema);
    } catch (e) {
        // almacenamiento no disponible (modo privado, etc.); se ignora
    }

    // Si ya hay datos cargados, se redibujan los gráficos con los
    // colores del nuevo tema, sin volver a consultar la API.
    if (ultimosDatos) {
        const fechas = ultimosDatos.map(item => item.fecha);
        const valores = ultimosDatos.map(item => item.valor_portafolio);
        dibujarGraficoValor(fechas, valores);
        dibujarGraficoWeights(ultimosDatos);
    }
}

function mostrarFechaHoy() {
    const hoy = new Date();
    const texto = new Intl.DateTimeFormat("es-CL", {
        weekday: undefined,
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(hoy);
    elFechaHoy.textContent = `Hoy, ${texto}`;
}

// ==============================================================
// Consultar la API
// ==============================================================

async function cargarDatos() {

    const portafolio = elPortafolio.value;
    const fechaInicio = elFechaInicio.value;
    const fechaFin = elFechaFin.value;

    if (!portafolio || !fechaInicio || !fechaFin) {
        mostrarMensaje("Selecciona portafolio, fecha inicio y fecha fin.", true);
        return;
    }

    const url =
        `/api/portafolio/?portafolio=${encodeURIComponent(portafolio)}` +
        `&fecha_inicio=${encodeURIComponent(fechaInicio)}` +
        `&fecha_fin=${encodeURIComponent(fechaFin)}`;

    establecerCargando(true);
    ocultarMensaje();

    try {

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`La API respondió con estado ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos) || datos.length === 0) {
            mostrarMensaje("No hay datos para el rango de fechas seleccionado.", false);
            limpiarGraficos();
            limpiarKpis();
            elResumenConsulta.classList.add("d-none");
            establecerBotonesDescarga(false);
            ultimosDatos = null;
            return;
        }

        ultimosDatos = datos;

        const fechas = datos.map(item => item.fecha);
        const valores = datos.map(item => item.valor_portafolio);

        dibujarGraficoValor(fechas, valores);
        dibujarGraficoWeights(datos);
        actualizarKpis(datos, valores);
        actualizarResumen(portafolio, fechaInicio, fechaFin);
        establecerBotonesDescarga(true);

    } catch (error) {
        console.error(error);
        mostrarMensaje("Ocurrió un error consultando la API. Revisa la consola para más detalle.", true);
    } finally {
        establecerCargando(false);
    }

}

// ==============================================================
// Gráfico de línea — valor del portafolio
// ==============================================================

function dibujarGraficoValor(fechas, valores) {

    if (graficoValor) {
        graficoValor.destroy();
    }

    const canvas = document.getElementById("graficoValor");
    const ctx = canvas.getContext("2d");

    const colorLinea = leerVariableTema("--chart-line");
    const colorGrid = leerVariableTema("--chart-grid");
    const colorTexto = leerVariableTema("--chart-text");
    const colorTooltipBg = leerVariableTema("--chart-tooltip-bg");
    const colorTooltipFg = leerVariableTema("--chart-tooltip-fg");
    const rellenoInicio = leerVariableTema("--chart-fill-start");
    const rellenoFin = leerVariableTema("--chart-fill-end");

    // Degradado vertical bajo la línea, más intenso arriba y transparente abajo.
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 360);
    gradiente.addColorStop(0, rellenoInicio);
    gradiente.addColorStop(1, rellenoFin);

    graficoValor = new Chart(ctx, {

        type: "line",

        data: {
            labels: fechas,
            datasets: [
                {
                    label: "Valor del portafolio",
                    data: valores,
                    borderColor: colorLinea,
                    backgroundColor: gradiente,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: colorLinea,
                    pointHoverBorderColor: "#FFFFFF",
                    pointHoverBorderWidth: 2,
                    borderWidth: 2.25,
                    fill: true,
                    tension: 0.3
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colorTooltipBg,
                    titleColor: colorTooltipFg,
                    bodyColor: colorTooltipFg,
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: "Inter", weight: "600" },
                    bodyFont: { family: "IBM Plex Mono" },
                    callbacks: {
                        title: (contextos) => formatearFecha(contextos[0].label),
                        label: (contexto) => `Valor: ${formatearMoneda(contexto.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 8,
                        color: colorTexto,
                        font: { family: "Inter", size: 11 }
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: { color: colorGrid },
                    border: { display: false },
                    ticks: {
                        maxTicksLimit: 6,
                        color: colorTexto,
                        font: { family: "IBM Plex Mono", size: 11 },
                        callback: (valor) => formatearMoneda(valor)
                    }
                }
            }
        }

    });

}

// ==============================================================
// Gráfico stacked area — composición por activo (weights)
// ==============================================================

function dibujarGraficoWeights(datos) {

    if (graficoWeights) {
        graficoWeights.destroy();
    }

    const fechas = datos.map(item => item.fecha);

    // Obtener los nombres de los activos automáticamente desde la
    // respuesta, preservando el orden en que aparecen.
    const nombresActivos = [];
    datos.forEach(item => {
        (item.weights || []).forEach(w => {
            if (!nombresActivos.includes(w.activo)) {
                nombresActivos.push(w.activo);
            }
        });
    });

    const datasets = nombresActivos.map((nombreActivo, indice) => {

        const color = colorParaIndice(indice);

        const serie = datos.map(item => {
            const encontrado = (item.weights || []).find(w => w.activo === nombreActivo);
            return encontrado ? encontrado.weight : 0;
        });

        return {
            label: nombreActivo,
            data: serie,
            fill: true,
            stack: "weights",
            borderColor: color,
            backgroundColor: hexAAlphaRgba(color, 0.75),
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: "#FFFFFF",
            pointHoverBorderWidth: 2,
            borderWidth: 1,
            tension: 0.25
        };

    });

    dibujarLeyendaActivos(nombresActivos);

    const ctx = document.getElementById("graficoWeights").getContext("2d");

    const colorGrid = leerVariableTema("--chart-grid");
    const colorTexto = leerVariableTema("--chart-text");
    const colorTooltipBg = leerVariableTema("--chart-tooltip-bg");
    const colorTooltipFg = leerVariableTema("--chart-tooltip-fg");

    graficoWeights = new Chart(ctx, {

        type: "line",

        data: {
            labels: fechas,
            datasets: datasets
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "nearest",
                intersect: false,
                axis: "x"
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colorTooltipBg,
                    titleColor: colorTooltipFg,
                    bodyColor: colorTooltipFg,
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true,
                    boxPadding: 4,
                    titleFont: { family: "Inter", weight: "600" },
                    bodyFont: { family: "IBM Plex Mono" },
                    callbacks: {
                        title: (contextos) => formatearFecha(contextos[0].label),
                        label: (contexto) => `${contexto.dataset.label}: ${formatearPorcentaje(contexto.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 8,
                        color: colorTexto,
                        font: { family: "Inter", size: 11 }
                    }
                },
                y: {
                    stacked: true,
                    min: 0,
                    max: 1,
                    grid: { color: colorGrid },
                    border: { display: false },
                    ticks: {
                        color: colorTexto,
                        font: { family: "IBM Plex Mono", size: 11 },
                        callback: (valor) => formatearPorcentaje(valor)
                    }
                }
            }
        }

    });

}

// ==============================================================
// Leyenda dinámica de activos
// ==============================================================

function dibujarLeyendaActivos(nombresActivos) {

    elLeyendaActivos.innerHTML = "";

    nombresActivos.forEach((nombre, indice) => {

        const color = colorParaIndice(indice);

        const item = document.createElement("span");
        item.className = "legend-item";

        const dot = document.createElement("span");
        dot.className = "legend-item__dot";
        dot.style.backgroundColor = color;

        const texto = document.createElement("span");
        texto.textContent = nombre;

        item.appendChild(dot);
        item.appendChild(texto);
        elLeyendaActivos.appendChild(item);

    });

}

// ==============================================================
// Tarjetas KPI
// ==============================================================

const ICONO_FLECHA_ARRIBA = `<svg class="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
const ICONO_FLECHA_ABAJO = `<svg class="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;

function actualizarKpis(datos, valores) {

    const valorInicial = valores[0];
    const valorFinal = valores[valores.length - 1];
    const rentabilidad = valorInicial !== 0
        ? ((valorFinal - valorInicial) / valorInicial) * 100
        : 0;

    const nombresActivos = new Set();
    datos.forEach(item => {
        (item.weights || []).forEach(w => nombresActivos.add(w.activo));
    });

    elKpiValorInicial.textContent = formatearMoneda(valorInicial);
    elKpiValorFinal.textContent = formatearMoneda(valorFinal);

    const esPositiva = rentabilidad >= 0;
    const icono = esPositiva ? ICONO_FLECHA_ARRIBA : ICONO_FLECHA_ABAJO;
    elKpiRentabilidad.innerHTML = `${icono}<span>${Math.abs(rentabilidad).toFixed(2)}%</span>`;
    elKpiRentabilidad.classList.remove("is-positive", "is-negative");
    elKpiRentabilidad.classList.add(esPositiva ? "is-positive" : "is-negative");

    elKpiActivos.textContent = nombresActivos.size;

}

function limpiarKpis() {
    elKpiValorInicial.textContent = "—";
    elKpiValorFinal.textContent = "—";
    elKpiRentabilidad.textContent = "—";
    elKpiRentabilidad.classList.remove("is-positive", "is-negative");
    elKpiActivos.textContent = "—";
}

function limpiarGraficos() {
    if (graficoValor) {
        graficoValor.destroy();
        graficoValor = null;
    }
    if (graficoWeights) {
        graficoWeights.destroy();
        graficoWeights = null;
    }
    elLeyendaActivos.innerHTML = "";
}

// ==============================================================
// Resumen de la consulta (portafolio + rango de fechas)
// ==============================================================

function actualizarResumen(portafolio, fechaInicio, fechaFin) {
    elResumenPortafolio.textContent = `Portafolio ${portafolio}`;
    elResumenRango.textContent = `${formatearFecha(fechaInicio)} — ${formatearFecha(fechaFin)}`;
    elResumenConsulta.classList.remove("d-none");
}

function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

// ==============================================================
// Descarga de gráficos como PNG
// ==============================================================

function descargarGrafico(chart, nombreArchivo) {
    if (!chart) {
        return;
    }
    const enlace = document.createElement("a");
    enlace.href = chart.toBase64Image();
    enlace.download = nombreArchivo;
    enlace.click();
}

function establecerBotonesDescarga(habilitados) {
    elDescargarValor.disabled = !habilitados;
    elDescargarWeights.disabled = !habilitados;
}

// ==============================================================
// Utilidades de formato
// ==============================================================

function formatearMoneda(valor) {
    // Formato completo y explícito, sin notación compacta ("1 B" / "1 mil M"),
    // para que un monto en pesos siempre se lea sin ambigüedad:
    // $1.000.000.000 en vez de $1 B.
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearPorcentaje(valor) {
    return new Intl.NumberFormat("es-CL", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(valor);
}

// ==============================================================
// Estado de carga / mensajes
// ==============================================================

function establecerCargando(estaCargando) {
    elBotonConsultar.disabled = estaCargando;
    elBotonConsultar.classList.toggle("is-loading", estaCargando);
}

function mostrarMensaje(texto, esError) {
    elEstadoMensajeTexto.textContent = texto;
    elEstadoMensaje.classList.remove("d-none");
    elEstadoMensaje.classList.toggle("is-error", esError);
}

function ocultarMensaje() {
    elEstadoMensaje.classList.add("d-none");
    elEstadoMensaje.classList.remove("is-error");
}