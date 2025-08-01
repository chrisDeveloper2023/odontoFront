import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";

const NewAppointmentForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        patientId: "",
        date: "",
        time: "",
        specialty: "",
        doctor: "",
        note: "",
    });

    // Datos simulados
    const patients = [
        { id: "1", name: "María González Pérez" },
        { id: "2", name: "Carlos Rodríguez López" },
        { id: "3", name: "Ana Martínez Silva" },
        { id: "4", name: "Juan Pérez Morales" },
    ];

    const specialties = ["Medicina General", "Pediatría", "Cardiología", "Odontología"];
    const doctors = ["Dra. Elena Ruiz", "Dr. Luis Méndez", "Dra. Paula Torres"];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Cita agendada:", formData);

        // Aquí podrías hacer un POST a una API real
        // await axios.post("/api/appointments", formData);

        navigate("/appointments"); // Redirigir a la lista de citas
    };

    const handleReset = () => {
        setFormData({
            patientId: "",
            date: "",
            time: "",
            specialty: "",
            doctor: "",
            note: "",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Agendar Cita Médica</h1>
                    <p className="text-muted-foreground">
                        Registra una nueva cita.
                    </p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Información de la Consulta
                        </CardTitle>
                        <CardDescription>Completa los datos para agendar una nueva cita.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Paciente</Label>
                                <Select
                                    value={formData.patientId}
                                    onValueChange={(value) => handleSelectChange("patientId", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <span>
                                            {formData.patientId
                                                ? patients.find((p) => p.id === formData.patientId)?.name
                                                : "Seleccionar paciente"}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Fecha</Label>
                                <Input
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Hora</Label>
                                <Input
                                    name="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Especialidad</Label>
                                <Select
                                    value={formData.specialty}
                                    onValueChange={(value) => handleSelectChange("specialty", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <span>{formData.specialty || "Seleccionar especialidad"}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {specialties.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Médico</Label>
                                <Select
                                    value={formData.doctor}
                                    onValueChange={(value) => handleSelectChange("doctor", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <span>{formData.doctor || "Seleccionar médico"}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((d) => (
                                            <SelectItem key={d} value={d}>
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Motivo / Nota</Label>
                                <Textarea
                                    name="note"
                                    placeholder="Ej: Dolor abdominal desde hace 3 días..."
                                    value={formData.note}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="secondary" onClick={handleReset}>
                                Limpiar
                            </Button>
                            <Button type="submit">Agendar Cita</Button>
                        </div>

                    </CardContent>
                </Card>
            </form>
        </div >
    );
};

export default NewAppointmentForm;
