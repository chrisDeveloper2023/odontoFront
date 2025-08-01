import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Save, User, FileText, Stethoscope, Pill, Heart } from "lucide-react";

const NewMedicalRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [formData, setFormData] = useState({
    patientId: patientId || "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    consultationType: "",
    chiefComplaint: "",
    symptoms: "",
    physicalExamination: "",
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    },
    diagnosis: "",
    differentialDiagnosis: "",
    treatment: "",
    medications: "",
    recommendations: "",
    followUpDate: "",
    doctorName: "",
    doctorLicense: "",
    orderTests: false,
    testsOrdered: "",
    referrals: "",
    allergiesNoted: "",
    currentMedications: "",
    additionalNotes: "",
  });

  // Datos de ejemplo de pacientes
  const patients = [
    { id: "1", name: "María González Pérez" },
    { id: "2", name: "Carlos Rodríguez López" },
    { id: "3", name: "Ana Martínez Silva" },
    { id: "4", name: "Juan Pérez Morales" },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("vitalSigns.")) {
      const vitalSign = field.replace("vitalSigns.", "");
      setFormData(prev => ({
        ...prev,
        vitalSigns: { ...prev.vitalSigns, [vitalSign]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.patientId || !formData.chiefComplaint || !formData.diagnosis || !formData.doctorName) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    // Aquí enviarías los datos al backend
    console.log("Historia clínica:", formData);
    
    toast.success("Historia clínica creada exitosamente");
    navigate("/medical-records");
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
          <h1 className="text-3xl font-bold text-foreground">Nueva Cita Médica</h1>
          <p className="text-muted-foreground">
            Registra una nueva Cita médica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la Consulta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información de la Consulta
            </CardTitle>
            <CardDescription>
              Datos básicos de la consulta (* campos obligatorios)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Paciente *</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(value) => handleInputChange("patientId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultationType">Tipo de Consulta</Label>
                <Select onValueChange={(value) => handleInputChange("consultationType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta-general">Consulta General</SelectItem>
                    <SelectItem value="consulta-especializada">Consulta Especializada</SelectItem>
                    <SelectItem value="control-rutina">Control de Rutina</SelectItem>
                    <SelectItem value="emergencia">Emergencia</SelectItem>
                    <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivo de Consulta y Síntomas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Motivo de Consulta y Síntomas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Motivo Principal de la Consulta *</Label>
              <Textarea
                id="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
                placeholder="¿Por qué viene el paciente hoy?"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Síntomas Detallados</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => handleInputChange("symptoms", e.target.value)}
                placeholder="Describe los síntomas del paciente en detalle"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signos Vitales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Signos Vitales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Presión Arterial</Label>
                <Input
                  id="bloodPressure"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={(e) => handleInputChange("vitalSigns.bloodPressure", e.target.value)}
                  placeholder="120/80 mmHg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Frecuencia Cardíaca</Label>
                <Input
                  id="heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={(e) => handleInputChange("vitalSigns.heartRate", e.target.value)}
                  placeholder="bpm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura</Label>
                <Input
                  id="temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={(e) => handleInputChange("vitalSigns.temperature", e.target.value)}
                  placeholder="°C"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso</Label>
                <Input
                  id="weight"
                  value={formData.vitalSigns.weight}
                  onChange={(e) => handleInputChange("vitalSigns.weight", e.target.value)}
                  placeholder="kg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Estatura</Label>
                <Input
                  id="height"
                  value={formData.vitalSigns.height}
                  onChange={(e) => handleInputChange("vitalSigns.height", e.target.value)}
                  placeholder="cm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Frecuencia Respiratoria</Label>
                <Input
                  id="respiratoryRate"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={(e) => handleInputChange("vitalSigns.respiratoryRate", e.target.value)}
                  placeholder="rpm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation">Saturación de Oxígeno</Label>
                <Input
                  id="oxygenSaturation"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={(e) => handleInputChange("vitalSigns.oxygenSaturation", e.target.value)}
                  placeholder="%"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examen Físico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Examen Físico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="physicalExamination">Hallazgos del Examen Físico</Label>
              <Textarea
                id="physicalExamination"
                value={formData.physicalExamination}
                onChange={(e) => handleInputChange("physicalExamination", e.target.value)}
                placeholder="Describe los hallazgos del examen físico completo"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico y Plan de Tratamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico Principal *</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                placeholder="Diagnóstico principal basado en la evaluación"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="differentialDiagnosis">Diagnósticos Diferenciales</Label>
              <Textarea
                id="differentialDiagnosis"
                value={formData.differentialDiagnosis}
                onChange={(e) => handleInputChange("differentialDiagnosis", e.target.value)}
                placeholder="Otros diagnósticos a considerar"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tratamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Tratamiento y Medicamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="treatment">Plan de Tratamiento</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) => handleInputChange("treatment", e.target.value)}
                placeholder="Describe el plan de tratamiento completo"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Medicamentos Prescritos</Label>
              <Textarea
                id="medications"
                value={formData.medications}
                onChange={(e) => handleInputChange("medications", e.target.value)}
                placeholder="Lista detallada de medicamentos con dosis y frecuencia"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recomendaciones</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) => handleInputChange("recommendations", e.target.value)}
                placeholder="Recomendaciones generales, cambios en estilo de vida, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exámenes y Seguimiento */}
        <Card>
          <CardHeader>
            <CardTitle>Exámenes y Seguimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="orderTests"
                checked={formData.orderTests}
                onCheckedChange={(checked) => handleInputChange("orderTests", !!checked)}
              />
              <Label htmlFor="orderTests">Ordenar exámenes de laboratorio o imagen</Label>
            </div>
            
            {formData.orderTests && (
              <div className="space-y-2">
                <Label htmlFor="testsOrdered">Exámenes Solicitados</Label>
                <Textarea
                  id="testsOrdered"
                  value={formData.testsOrdered}
                  onChange={(e) => handleInputChange("testsOrdered", e.target.value)}
                  placeholder="Lista de exámenes solicitados"
                  rows={3}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Fecha de Seguimiento</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referrals">Referencias a Especialistas</Label>
                <Input
                  id="referrals"
                  value={formData.referrals}
                  onChange={(e) => handleInputChange("referrals", e.target.value)}
                  placeholder="Especialistas referidos"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Médico */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Médico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Nombre del Médico *</Label>
                <Input
                  id="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange("doctorName", e.target.value)}
                  placeholder="Dr./Dra. Nombre Completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorLicense">Número de Colegiado</Label>
                <Input
                  id="doctorLicense"
                  value={formData.doctorLicense}
                  onChange={(e) => handleInputChange("doctorLicense", e.target.value)}
                  placeholder="Número de colegiado médico"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas Adicionales */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Observaciones Adicionales</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                placeholder="Cualquier información adicional relevante"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar Historia Clínica
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewMedicalRecord;