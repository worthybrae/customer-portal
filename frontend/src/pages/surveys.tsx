// pages/surveys.tsx (updated)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteSurvey, fetchSurveyWithQuestions } from '../lib/supabase';
import { Survey } from '../types';

// Import components
import SurveyList from '../components/surveys/SurveyList';
import SurveyForm from '../components/surveys/SurveyForm';

// Import shadcn components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";

export default function SurveysPage() {
  const navigate = useNavigate();
  const { user, company, loading } = useAuth();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if not logged in
  if (!loading && !user) {
    navigate('/auth/signin');
    return null;
  }

  // Get company ID from the user's company (if available)
  const getCompanyId = () => {
    // If company exists, use its ID
    if (company) {
      return company.id;
    }
    
    // If no company but we have a user, use user ID for personal surveys
    if (user) {
      return user.id;
    }
    
    return ''; // Empty string, but this should never happen if user is authenticated
  };

  const handleCreateClick = () => {
    setSelectedSurvey(null);
    setFormOpen(true);
  };

  const handleEditClick = async (survey: Survey) => {
    try {
      // Fetch the full survey with questions before editing
      if (!survey.questions) {
        const fullSurvey = await fetchSurveyWithQuestions(survey.id);
        setSelectedSurvey(fullSurvey);
      } else {
        setSelectedSurvey(survey);
      }
      setFormOpen(true);
    } catch (error) {
      console.error('Error fetching survey details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load survey details. Please try again.",
      });
    }
  };

  const handleViewClick = async (survey: Survey) => {
    try {
      // Fetch the full survey with questions before viewing
      if (!survey.questions) {
        const fullSurvey = await fetchSurveyWithQuestions(survey.id);
        // In a real app, navigate to a survey viewer
        // navigate(`/surveys/${survey.id}`);
        toast({
          title: "Survey View",
          description: `Viewing survey: ${fullSurvey.title} with ${fullSurvey.questions?.length || 0} questions`,
        });
      } else {
        // navigate(`/surveys/${survey.id}`);
        toast({
          title: "Survey View",
          description: `Viewing survey: ${survey.title} with ${survey.questions?.length || 0} questions`,
        });
      }
    } catch (error) {
      console.error('Error fetching survey details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load survey details. Please try again.",
      });
    }
  };

  const handleDeleteClick = (survey: Survey) => {
    setSelectedSurvey(survey);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSurvey) return;
    
    try {
      await deleteSurvey(selectedSurvey.id);
      
      toast({
        title: "Survey deleted",
        description: "The survey has been successfully deleted.",
      });
      
      // Trigger a refresh of the survey list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting survey:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the survey. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSurvey(null);
    }
  };

  const handleFormSuccess = () => {
    toast({
      title: selectedSurvey ? "Survey updated" : "Survey created",
      description: selectedSurvey
        ? "Your survey has been updated successfully."
        : "Your new survey has been created successfully.",
    });
    
    // Trigger a refresh of the survey list
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Main content */}
      <div className="space-y-6">

        {/* Survey List */}
        <SurveyList
          key={refreshKey} // Force re-render when refreshKey changes
          companyId={getCompanyId()}
          onCreateClick={handleCreateClick}
          onEditClick={handleEditClick}
          onViewClick={handleViewClick}
          onDeleteClick={handleDeleteClick}
        />
      </div>

      {/* Survey Form Dialog */}
      <SurveyForm
        companyId={getCompanyId()}
        survey={selectedSurvey || undefined}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the survey "{selectedSurvey?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}