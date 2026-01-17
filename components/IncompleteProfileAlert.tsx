
import React from 'react';
import { AlertTriangle, Edit } from 'lucide-react';

interface IncompleteProfileAlertProps {
    missingFields: string[];
    isDark: boolean;
    onEditProfile: () => void;
    entityType?: 'employee' | 'institution';
}

/**
 * Alert component displayed when user's profile has missing mandatory fields.
 * Shows warning to complete: RUT, email, name for employees; name, city for institutions.
 */
export const IncompleteProfileAlert: React.FC<IncompleteProfileAlertProps> = ({
    missingFields,
    isDark,
    onEditProfile,
    entityType = 'employee'
}) => {
    if (missingFields.length === 0) return null;

    return (
        <div className={`
      p-6 rounded-[24px] border-2 border-amber-500/40 
      ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}
      mb-8 animate-in fade-in slide-in-from-top-4 duration-500
    `}>
            <div className="flex items-center gap-5">
                {/* Warning Icon */}
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>

                {/* Message */}
                <div className="flex-1">
                    <h3 className="text-lg font-black uppercase tracking-tight text-amber-600">
                        Perfil Incompleto
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'opacity-70' : 'text-slate-600'}`}>
                        Por favor complete los siguientes datos obligatorios para continuar:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {missingFields.map(field => (
                            <span
                                key={field}
                                className={`
                  px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                  ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-700'}
                `}
                            >
                                {field}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onEditProfile}
                    className="
            px-6 py-4 bg-amber-500 text-white font-black text-[11px] uppercase tracking-widest
            rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30
            flex items-center gap-2 hover:scale-105
          "
                >
                    <Edit className="w-4 h-4" />
                    Completar Perfil
                </button>
            </div>
        </div>
    );
};

export default IncompleteProfileAlert;
