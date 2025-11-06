import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uiTheme } from "@/lib/ui-theme";
import { API_ENDPOINTS } from "@/constants/api";
import { formatGuayaquilDateISO } from "@/lib/timezone";
import { apiGet } from "@/api/client";
import { useClinicas } from "@/servicios/clinicas";
import {
	BarChart3,
	Users,
	ClipboardList,
	Calendar,
	CalendarDays,
	Building2,
	HeartPulse,
	Sparkles,
	ArrowUpRight,
} from "lucide-react";

type RawPaciente = {
	id_paciente: number;
	nombres: string;
	apellidos: string;
	fecha_nacimiento: string;
	fecha_creacion: string;
	telefono: string;
	correo: string;
	activo: boolean;
};

const DEFAULT_CARD_SHADOW = { boxShadow: uiTheme.shadow };

export default function Dashboard() {
	const [totalPatients, setTotalPatients] = useState(0);
	const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0);
	const [appointmentsToday, setAppointmentsToday] = useState<number | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);
	const [statsError, setStatsError] = useState<string | null>(null);

	const {
		clinics,
		total: totalClinics,
		activeCount: activeClinics,
		loading: clinicsLoading,
		error: clinicsError,
	} = useClinicas();

	useEffect(() => {
		async function fetchStats() {
			setIsLoadingStats(true);
			setStatsError(null);
			try {
				const pacientesResponse = await apiGet<{ data: RawPaciente[]; total?: number }>(
					API_ENDPOINTS.PACIENTES,
					{
						page: 1,
						limit: 1000,
					},
				);

				const pacientes = Array.isArray(pacientesResponse.data) ? pacientesResponse.data : [];
				const pacientesTotal =
					typeof pacientesResponse.total === "number"
						? pacientesResponse.total
						: pacientes.length;

				setTotalPatients(pacientesTotal);

				const todayIso = formatGuayaquilDateISO(new Date());
				const todayParts = todayIso.split("-");
				const currentYear = Number(todayParts[0] ?? 0);
				const currentMonth = Number(todayParts[1] ?? 0);

				const nuevosEsteMes = pacientes.filter((paciente) => {
					const createdAt = formatGuayaquilDateISO(paciente.fecha_creacion);
					if (!createdAt) return false;
					const [yearStr, monthStr] = createdAt.split("-");
					return Number(yearStr) === currentYear && Number(monthStr) === currentMonth;
				}).length;

				setNewPatientsThisMonth(nuevosEsteMes);

				const citasResponse = await apiGet<any>(API_ENDPOINTS.CITAS, {
					page: 1,
					limit: 1,
					date_from: todayIso,
					date_to: todayIso,
				});

				const citasLista: unknown[] = Array.isArray(citasResponse)
					? citasResponse
					: Array.isArray(citasResponse?.data)
						? citasResponse.data
						: Array.isArray(citasResponse?.citas)
							? citasResponse.citas
							: Array.isArray(citasResponse?.items)
								? citasResponse.items
								: [];

				const citasTotalRaw =
					citasResponse?.total ??
					citasResponse?.count ??
					citasResponse?.totalCount ??
					citasResponse?.meta?.total ??
					citasLista.length;

				const citasTotal =
					typeof citasTotalRaw === "number" && !Number.isNaN(citasTotalRaw)
						? citasTotalRaw
						: citasLista.length;

				setAppointmentsToday(citasTotal);
			} catch (error) {
				console.error("No se pudieron cargar las estadisticas del dashboard", error);
				const message =
					error instanceof Error ? error.message : "No se pudieron cargar las estadisticas";
				setStatsError(message);
			} finally {
				setIsLoadingStats(false);
			}
		}

		void fetchStats();
	}, []);

	const isLoading = isLoadingStats || clinicsLoading;
	const combinedError = useMemo(() => statsError ?? clinicsError ?? null, [statsError, clinicsError]);

	const highlightStats = useMemo(
		() => [
			{
				label: "Citas agendadas hoy",
				value:
					appointmentsToday === null || Number.isNaN(appointmentsToday)
						? "--"
						: String(appointmentsToday),
				subtitle: "Revisa horarios y disponibilidad",
				icon: CalendarDays,
			},
			{
				label: "Pacientes nuevos",
				value: String(newPatientsThisMonth),
				subtitle: "Mes en curso",
				icon: Users,
			},
			{
				label: "Clínicas activas",
				value: String(activeClinics),
				subtitle: `${totalClinics} registradas`,
				icon: Building2,
			},
		],
		[appointmentsToday, newPatientsThisMonth, activeClinics, totalClinics],
	);

	const metrics = useMemo(
		() => [
			{
				label: "Citas de Hoy",
				value:
					appointmentsToday === null || Number.isNaN(appointmentsToday)
						? "--"
						: String(appointmentsToday),
				detail: "Agendadas",
				icon: Calendar,
				accent: "bg-primary/10 text-primary",
			},
			{
				label: "Pacientes Activos",
				value: String(totalPatients),
				detail: `${newPatientsThisMonth} este mes`,
				icon: Users,
				accent: "bg-secondary/30 text-primary",
			},
			{
				label: "Consultorios",
				value: String(activeClinics),
				detail: `${totalClinics} registrados`,
				icon: ClipboardList,
				accent: "bg-[#EDF2FF] text-primary",
			},
			{
				label: "Historias Nuevas",
				value: newPatientsThisMonth ? String(newPatientsThisMonth) : "0",
				detail: "Últimos 30 días",
				icon: BarChart3,
				accent: "bg-[#FFEFD5] text-primary",
			},
		],
		[appointmentsToday, totalPatients, newPatientsThisMonth, activeClinics, totalClinics],
	);

	const topClinics = useMemo(() => clinics.slice(0, 4), [clinics]);
	const patientGrowth =
		totalPatients > 0 ? Math.min(100, Math.round((newPatientsThisMonth / totalPatients) * 100)) : 0;

	if (isLoading) {
		return (
			<div className="p-6 min-h-screen" style={{ fontFamily: uiTheme.typography.fontFamily }}>
				Cargando panel…
			</div>
		);
	}

	return (
		<div
			className="p-6 bg-neutral-light min-h-screen text-neutral-dark"
			style={{ fontFamily: uiTheme.typography.fontFamily }}
		>
			<div className="grid gap-6">
				<section className="relative overflow-hidden rounded-3xl px-6 py-8 text-neutral-dark shadow-xl bg-gradient-to-br from-base via-secondary/60 to-base">
					<div
						className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
						aria-hidden="true"
					/>
					<div
						className="pointer-events-none absolute inset-0 opacity-20"
						style={{
							backgroundImage:
								"radial-gradient(circle at 20% 20%, rgba(26,54,93,0.12) 0, transparent 50%), radial-gradient(circle at 80% 0%, rgba(185,230,201,0.35) 0, transparent 45%)",
						}}
						aria-hidden="true"
					/>
					<div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-xl space-y-5">
							<Badge variant="secondary" className="bg-secondary text-primary font-semibold shadow-sm">
								<Sparkles className="mr-2 h-4 w-4" />
								Plan Profesional
							</Badge>
							<div className="space-y-2">
								<h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
									Panel principal listo para impulsar tu clínica
								</h1>
								<p className="text-base text-neutral-dark/70">
									Monitorea indicadores claves, gestiona pacientes y mantén tus consultorios ocupados con un vistazo rápido.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-4 text-neutral-dark/70">
								<div className="flex items-center gap-2 text-primary">
									<HeartPulse className="h-4 w-4" />
									<span className="text-sm text-neutral-dark">Operación en curso sin incidencias</span>
								</div>
								<div className="flex items-center gap-2 text-primary">
									<ArrowUpRight className="h-4 w-4" />
									<span className="text-sm text-neutral-dark">
										{patientGrowth}% de crecimiento en pacientes este mes
									</span>
								</div>
							</div>
						</div>

						<div className="grid w-full gap-4 sm:grid-cols-3 lg:w-auto">
							{highlightStats.map((stat) => {
								const Icon = stat.icon;
								return (
									<div
										key={stat.label}
										className="rounded-2xl border border-primary/10 bg-white/80 px-5 py-4 text-neutral-dark backdrop-blur-sm transition hover:bg-white"
									>
										<div className="flex items-center gap-3">
											<span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
												<Icon className="h-5 w-5" />
											</span>
											<div>
												<p className="text-xs uppercase tracking-wide text-neutral-dark/60">{stat.label}</p>
												<p className="text-xl font-semibold text-primary">{stat.value}</p>
											</div>
										</div>
										<p className="mt-3 text-xs text-neutral-dark/60">{stat.subtitle}</p>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				{combinedError ? (
					<Card className="border border-red-100 bg-white/90 backdrop-blur-sm">
						<CardContent className="py-4 text-sm text-red-600">
							{combinedError}. Intenta recargar la página para reintentar.
						</CardContent>
					</Card>
				) : null}

				<section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{metrics.map((metric) => {
						const Icon = metric.icon;
						return (
							<Card
								key={metric.label}
								className="group border-none bg-white/90 text-neutral-dark backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl"
								style={DEFAULT_CARD_SHADOW}
							>
								<CardHeader className="flex flex-row items-center justify-between">
									<CardTitle className="text-base font-medium text-neutral-dark">{metric.label}</CardTitle>
									<span
										className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition group-hover:scale-105 ${metric.accent}`}
									>
										<Icon className="h-5 w-5" />
									</span>
								</CardHeader>
								<CardContent className="space-y-2">
									<p className="text-3xl font-semibold text-primary">{metric.value}</p>
									<p className="text-sm text-neutral-dark/70">{metric.detail}</p>
								</CardContent>
							</Card>
						);
					})}
				</section>

				<section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<Card className="border-none bg-white/90 text-neutral-dark backdrop-blur-sm" style={DEFAULT_CARD_SHADOW}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-primary">
								<Sparkles className="h-5 w-5" />
								Accesos rápidos
							</CardTitle>
							<p className="text-sm text-neutral-dark/70">
								Acciones frecuentes para tu equipo administrativo.
							</p>
						</CardHeader>
						<CardContent className="grid gap-3">
							<Link to="/patients/new">
								<Button
									variant="ghost"
									className="flex w-full items-center justify-between rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary transition hover:bg-primary/10"
								>
									<span>Registrar paciente</span>
									<Users className="h-4 w-4" />
								</Button>
							</Link>
							<Link to="/appointments/new">
								<Button
									variant="ghost"
									className="flex w-full items-center justify-between rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary transition hover:bg-primary/10"
								>
									<span>Programar cita</span>
									<Calendar className="h-4 w-4" />
								</Button>
							</Link>
							<Link to="/medical-records/new">
								<Button
									variant="ghost"
									className="flex w-full items-center justify-between rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary transition hover:bg-primary/10"
								>
									<span>Crear historia clínica</span>
									<BarChart3 className="h-4 w-4" />
								</Button>
							</Link>
							<Link to="/clinics">
								<Button
									variant="ghost"
									className="flex w-full items-center justify-between rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary transition hover:bg-primary/10"
								>
									<span>Gestionar consultorios</span>
									<ClipboardList className="h-4 w-4" />
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card className="border-none bg-white/90 text-neutral-dark backdrop-blur-sm lg:col-span-2" style={DEFAULT_CARD_SHADOW}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-primary">
								<ClipboardList className="h-5 w-5" />
								Clínicas destacadas
							</CardTitle>
							<p className="text-sm text-neutral-dark/70">
								Vista rápida de las últimas clínicas registradas en tu red.
							</p>
						</CardHeader>
						<CardContent className="space-y-4">
							{topClinics.length ? (
								<ul className="space-y-3">
									{topClinics.map((clinic) => (
										<li
											key={clinic.id}
											className="flex items-center justify-between rounded-xl border border-primary/10 bg-base px-4 py-3 shadow-sm"
										>
											<div>
												<p className="text-sm font-medium text-primary">{clinic.nombre}</p>
												{clinic.direccion ? (
													<p className="text-xs text-neutral-dark/70">{clinic.direccion}</p>
												) : null}
											</div>
											<Badge variant="secondary" className={clinic.activo ? "bg-secondary text-primary" : ""}>
												{clinic.activo ? "Activa" : "Inactiva"}
											</Badge>
										</li>
									))}
								</ul>
							) : (
								<p className="rounded-xl border border-dashed border-primary/20 py-6 text-center text-sm text-neutral-dark/70">
									Aún no hay clínicas registradas. ¡Agrega la primera para empezar a organizar tu operación!
								</p>
							)}
						</CardContent>
					</Card>
				</section>
			</div>
		</div>
	);
}
