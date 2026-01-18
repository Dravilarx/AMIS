import { useDocumentRepository } from './useDocumentRepository';
import { useMemo, useCallback } from 'react';
import { RCDDocumentProfile, ProfileAssignment, CentralDocument } from '../types';

/**
 * Hook for consuming document profiles in other modules.
 * Provides simplified access to profiles and assignments for a specific entity.
 */
export const useDocumentProfiles = (entityType: 'employee' | 'institution', entityId: string) => {
    const {
        documents,
        profiles,
        assignments,
        isLoading,
        assignProfile,
        updateAssignmentStatus,
        getDocumentsByProfile,
        getCompletionPercentage
    } = useDocumentRepository();

    // Get all profiles applicable to this entity type
    const applicableProfiles = useMemo(() => {
        return profiles.filter(p => p.applicableTo.includes(entityType));
    }, [profiles, entityType]);

    // Get profiles assigned to this specific entity
    const entityAssignments = useMemo(() => {
        return assignments.filter(a => a.entityType === entityType && a.entityId === entityId);
    }, [assignments, entityType, entityId]);

    // Get assigned profiles with their completion status
    const assignedProfiles = useMemo(() => {
        return entityAssignments.map(assignment => {
            const profile = profiles.find(p => p.id === assignment.profileId);
            if (!profile) return null;

            const docs = getDocumentsByProfile(profile.id);
            const completion = getCompletionPercentage(assignment.id);

            return {
                profile,
                assignment,
                documents: docs,
                completionPercentage: completion,
                pendingCount: assignment.completionStatus.filter(s => s.status === 'pending').length,
                uploadedCount: assignment.completionStatus.filter(s => s.status === 'uploaded').length,
                verifiedCount: assignment.completionStatus.filter(s => s.status === 'verified').length
            };
        }).filter(Boolean) as {
            profile: RCDDocumentProfile;
            assignment: ProfileAssignment;
            documents: CentralDocument[];
            completionPercentage: number;
            pendingCount: number;
            uploadedCount: number;
            verifiedCount: number;
        }[];
    }, [entityAssignments, profiles, getDocumentsByProfile, getCompletionPercentage]);

    // Check if entity has any assigned profiles
    const hasAssignedProfiles = assignedProfiles.length > 0;

    // Get overall compliance percentage for the entity
    const overallCompliance = useMemo(() => {
        if (assignedProfiles.length === 0) return 100;
        const total = assignedProfiles.reduce((sum, ap) => sum + ap.completionPercentage, 0);
        return Math.round(total / assignedProfiles.length);
    }, [assignedProfiles]);

    // Assign a profile to this entity
    const assignProfileToEntity = useCallback(async (profileId: string, assignedBy: string) => {
        return await assignProfile(profileId, entityType, entityId, assignedBy);
    }, [assignProfile, entityType, entityId]);

    // Update document status in an assignment
    const updateDocumentStatus = useCallback(async (
        assignmentId: string,
        documentId: string,
        status: 'pending' | 'uploaded' | 'verified' | 'expired',
        fileUrl?: string,
        verifiedBy?: string
    ) => {
        return await updateAssignmentStatus(assignmentId, documentId, status, fileUrl, verifiedBy);
    }, [updateAssignmentStatus]);

    return {
        // State
        isLoading,
        applicableProfiles,
        assignedProfiles,
        hasAssignedProfiles,
        overallCompliance,

        // Actions
        assignProfileToEntity,
        updateDocumentStatus
    };
};
