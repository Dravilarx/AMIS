
import { Employee, Institution, ProfileValidation } from '../types';

/**
 * Hook for validating mandatory profile fields
 * - Employees: RUT (idNumber), email, firstName, lastName
 * - Institutions: name, city
 */
export const useProfileValidation = () => {

    /**
     * Validates Employee mandatory fields
     * @returns ProfileValidation with completion status and missing fields
     */
    const validateEmployee = (employee: Employee): ProfileValidation => {
        const missingFields: string[] = [];

        if (!employee.idNumber?.trim()) missingFields.push('RUT');
        if (!employee.email?.trim()) missingFields.push('Correo Electrónico');
        if (!employee.firstName?.trim()) missingFields.push('Nombre');
        if (!employee.lastName?.trim()) missingFields.push('Apellido');

        return {
            isComplete: missingFields.length === 0,
            missingFields,
            authorizedIncomplete: employee.adminAuthorizedIncomplete || false
        };
    };

    /**
     * Validates Institution mandatory fields
     * @returns ProfileValidation with completion status and missing fields
     */
    const validateInstitution = (institution: Institution): ProfileValidation => {
        const missingFields: string[] = [];

        if (!institution.name?.trim()) missingFields.push('Nombre');
        if (!institution.city?.trim()) missingFields.push('Ciudad');

        return {
            isComplete: missingFields.length === 0,
            missingFields,
            authorizedIncomplete: false
        };
    };

    /**
     * Filter employees with incomplete profiles
     */
    const getIncompleteEmployees = (employees: Employee[]): Employee[] => {
        return employees.filter(emp => {
            const validation = validateEmployee(emp);
            return !validation.isComplete && !validation.authorizedIncomplete;
        });
    };

    /**
     * Filter institutions with incomplete data
     */
    const getIncompleteInstitutions = (institutions: Institution[]): Institution[] => {
        return institutions.filter(inst => !validateInstitution(inst).isComplete);
    };

    return {
        validateEmployee,
        validateInstitution,
        getIncompleteEmployees,
        getIncompleteInstitutions
    };
};
