
import React, { useState, KeyboardEvent } from 'react';
import { X, Check, Camera, Mail, Phone, Calendar, Globe, School, IdCard, Tag, Layers, MapPin, Award as AwardIcon, Activity, Building } from 'lucide-react';
import { Employee } from '../../../types';

interface Props {
  isDark: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const EmployeeForm: React.FC<Props> = ({ isDark, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '', lastName: '', birthDate: '', joinDate: new Date().toISOString().split('T')[0],
    university: '', email: '', phone: '', idNumber: '', nationality: '', residenceCountry: '',
    role: 'Médico', department: '', subSpecialty: '', group: '', hiringEntity: '', tags: [], photo: '',
    status: 'Activo'
  });
  const [tagInput, setTagInput] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(',', '');
      if (val && !formData.tags?.includes(val)) {
        setFormData({ ...formData, tags: [...(formData.tags || []), val] });
        setTagInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-5xl max-h-[95vh] overflow-hidden p-0 rounded-[40px] border animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Ficha de Registro Staff</h3>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className={`w-56 h-56 rounded-3xl border-4 border-dashed flex items-center justify-center overflow-hidden relative group transition-all ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  {formData.photo ? <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="w-12 h-12 opacity-10" />}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Cambiar Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <InputGroup label="Grupo Corporativo" icon={<Layers className="w-3 h-3"/>} value={formData.group} onChange={v => setFormData({...formData, group: v})} placeholder="Ej. Staff Senior" isDark={isDark} />
                <InputGroup label="Razón Social Contratante" icon={<Building className="w-3 h-3"/>} value={formData.hiringEntity} onChange={v => setFormData({...formData, hiringEntity: v})} placeholder="Ej. AMIS SORAN SPA" isDark={isDark} required />
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2"><Tag className="w-3 h-3"/> Tags</label>
                  <div className={`flex flex-wrap gap-2 p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    {formData.tags?.map((tag, idx) => (
                      <span key={idx} className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1">
                        {tag} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setFormData({...formData, tags: formData.tags?.filter((_, i) => i !== idx)})} />
                      </span>
                    ))}
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Add tag..." className="flex-grow bg-transparent outline-none text-xs p-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Nombre" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} placeholder="Isaac" isDark={isDark} required />
                <InputGroup label="Apellidos" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} placeholder="Newton" isDark={isDark} required />
                <InputGroup label="RUT / DNI" icon={<IdCard className="w-3 h-3"/>} value={formData.idNumber} onChange={v => setFormData({...formData, idNumber: v})} placeholder="12.345.678-9" isDark={isDark} required />
                <InputGroup label="Nacionalidad" icon={<Globe className="w-3 h-3"/>} value={formData.nationality} onChange={v => setFormData({...formData, nationality: v})} placeholder="Chilena" isDark={isDark} required />
                <InputGroup label="Residencia" icon={<MapPin className="w-3 h-3"/>} value={formData.residenceCountry} onChange={v => setFormData({...formData, residenceCountry: v})} placeholder="Chile" isDark={isDark} required />
                <InputGroup label="F. Nacimiento" icon={<Calendar className="w-3 h-3"/>} type="date" value={formData.birthDate} onChange={v => setFormData({...formData, birthDate: v})} isDark={isDark} required />
                <InputGroup label="F. Incorporación" icon={<Calendar className="w-3 h-3"/>} type="date" value={formData.joinDate} onChange={v => setFormData({...formData, joinDate: v})} isDark={isDark} required />
                <InputGroup label="Correo" icon={<Mail className="w-3 h-3"/>} type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="name@amis.health" isDark={isDark} required />
                <InputGroup label="Teléfono" icon={<Phone className="w-3 h-3"/>} type="tel" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+56 9 ..." isDark={isDark} required />
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2"><Activity className="w-3 h-3"/> Estado Laboral</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className={`w-full p-4 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <option value="Activo">Activo</option>
                    <option value="Licencia Médica">Licencia Médica</option>
                    <option value="Vacaciones">Vacaciones</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Renuncia">Renuncia</option>
                    <option value="Baja Temporal">Baja Temporal</option>
                  </select>
                </div>
              </div>

              <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                <InputGroup className="md:col-span-2" label="Universidad" icon={<School className="w-3 h-3"/>} value={formData.university} onChange={v => setFormData({...formData, university: v})} placeholder="Casa de estudios" isDark={isDark} required />
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Cargo</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className={`w-full p-4 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <option value="Médico">Médico</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Enfermería">Enfermería</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <InputGroup label="Departamento" value={formData.department} onChange={v => setFormData({...formData, department: v})} placeholder="Radiología" isDark={isDark} required />
                <InputGroup className="md:col-span-2" label="Subespecialidad" icon={<AwardIcon className="w-3 h-3"/>} value={formData.subSpecialty} onChange={v => setFormData({...formData, subSpecialty: v})} placeholder="Neurorradiología" isDark={isDark} />
              </div>
            </div>
          </div>
          <div className="mt-12 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl font-black text-xs uppercase opacity-40 hover:opacity-100 transition-all">Cancelar</button>
            <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
              <Check className="w-5 h-5" /> Confirmar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, value, onChange, placeholder, isDark, type = "text", required = false, className = "" }: any) => (
  <div className={className}>
    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
      {icon} {label}
    </label>
    <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full p-4 rounded-xl border outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
  </div>
);

export default EmployeeForm;
