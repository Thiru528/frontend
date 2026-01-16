import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { resumeAPI } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FancyLoader from '../../components/FancyLoader';

const ResumeBuildScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      github: '',
    },
    summary: '',
    experience: [
      {
        company: '',
        position: '',
        duration: '',
        description: '',
      },
    ],
    education: [
      {
        institution: '',
        degree: '',
        year: '',
        gpa: '',
      },
    ],
    skills: '',
    projects: [
      {
        name: '',
        description: '',
        technologies: '',
        link: '',
      },
    ],
    style: 'modern', // Default style
  });

  const steps = [
    { title: 'Personal Info', icon: 'person-outline' },
    { title: 'Summary', icon: 'document-text-outline' },
    { title: 'Experience', icon: 'briefcase-outline' },
    { title: 'Education', icon: 'school-outline' },
    { title: 'Skills', icon: 'code-outline' },
    { title: 'Projects', icon: 'folder-outline' },
    { title: 'Style', icon: 'color-palette-outline' },
  ];

  const updateFormData = (section, field, value, index = null) => {
    setFormData(prev => {
      if (index !== null) {
        const newArray = [...prev[section]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      } else if (section === 'personalInfo') {
        return {
          ...prev,
          personalInfo: { ...prev.personalInfo, [field]: value }
        };
      } else {
        return { ...prev, [field]: value };
      }
    });
  };

  const addArrayItem = (section) => {
    const templates = {
      experience: { company: '', position: '', duration: '', description: '' },
      education: { institution: '', degree: '', year: '', gpa: '' },
      projects: { name: '', description: '', technologies: '', link: '' },
    };

    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], templates[section]]
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerateResume();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateResume = async () => {
    try {
      setLoading(true);

      const response = await resumeAPI.buildResume(formData);

      if (response.data.success) {
        setLoading(false);

        if (Platform.OS === 'web') {
          alert('Resume Generated! Your new resume is ready in Versions.');
          navigation.navigate('ResumeVersions');
        } else {
          Alert.alert(
            'Resume Generated!',
            'Your AI-powered resume has been created successfully.',
            [
              {
                text: 'View Versions',
                onPress: () => navigation.navigate('ResumeVersions'),
              },
            ]
          );
        }
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      setLoading(false);
      const msg = 'Failed to generate resume. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const renderPersonalInfo = () => (
    <View>
      <Input
        label="Full Name *"
        value={formData.personalInfo.fullName}
        onChangeText={(value) => updateFormData('personalInfo', 'fullName', value)}
        placeholder="John Doe"
      />
      <Input
        label="Email *"
        value={formData.personalInfo.email}
        onChangeText={(value) => updateFormData('personalInfo', 'email', value)}
        placeholder="john@example.com"
        keyboardType="email-address"
      />
      <Input
        label="Phone *"
        value={formData.personalInfo.phone}
        onChangeText={(value) => updateFormData('personalInfo', 'phone', value)}
        placeholder="+1 (555) 123-4567"
        keyboardType="phone-pad"
      />
      <Input
        label="Location"
        value={formData.personalInfo.location}
        onChangeText={(value) => updateFormData('personalInfo', 'location', value)}
        placeholder="San Francisco, CA"
      />
      <Input
        label="LinkedIn"
        value={formData.personalInfo.linkedIn}
        onChangeText={(value) => updateFormData('personalInfo', 'linkedIn', value)}
        placeholder="linkedin.com/in/johndoe"
      />
      <Input
        label="GitHub"
        value={formData.personalInfo.github}
        onChangeText={(value) => updateFormData('personalInfo', 'github', value)}
        placeholder="github.com/johndoe"
      />
    </View>
  );

  const renderSummary = () => (
    <View>
      <Input
        label="Professional Summary *"
        value={formData.summary}
        onChangeText={(value) => updateFormData(null, 'summary', value)}
        placeholder="Write a brief summary of your professional background and career objectives..."
        multiline
        numberOfLines={4}
      />
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        Tip: Keep it concise (2-3 sentences) and highlight your key strengths and career goals.
      </Text>
      <Button
        title="✨ Generate with AI"
        onPress={handleGenerateSummary}
        variant="outline"
        size="small"
        style={{ marginTop: 12, borderWidth: 1, borderColor: colors.primary }}
        textStyle={{ color: colors.primary }}
        loading={loading}
      />
    </View>
  );

  const renderExperience = () => (
    <View>
      {formData.experience.map((exp, index) => (
        <Card key={index} style={styles.arrayItem}>
          <View style={styles.arrayHeader}>
            <Text style={[styles.arrayTitle, { color: colors.text }]}>
              Experience {index + 1}
            </Text>
            {formData.experience.length > 1 && (
              <TouchableOpacity
                onPress={() => removeArrayItem('experience', index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          <Input
            label="Company *"
            value={exp.company}
            onChangeText={(value) => updateFormData('experience', 'company', value, index)}
            placeholder="Company Name"
          />
          <Input
            label="Position *"
            value={exp.position}
            onChangeText={(value) => updateFormData('experience', 'position', value, index)}
            placeholder="Software Engineer"
          />
          <Input
            label="Duration *"
            value={exp.duration}
            onChangeText={(value) => updateFormData('experience', 'duration', value, index)}
            placeholder="Jan 2020 - Present"
          />
          <Input
            label="Description"
            value={exp.description}
            onChangeText={(value) => updateFormData('experience', 'description', value, index)}
            placeholder="Describe your key responsibilities and achievements..."
            multiline
            numberOfLines={3}
          />
        </Card>
      ))}

      <Button
        title="+ Add Experience"
        onPress={() => addArrayItem('experience')}
        variant="secondary"
        style={styles.addButton}
      />
    </View>
  );

  const renderEducation = () => (
    <View>
      {formData.education.map((edu, index) => (
        <Card key={index} style={styles.arrayItem}>
          <View style={styles.arrayHeader}>
            <Text style={[styles.arrayTitle, { color: colors.text }]}>
              Education {index + 1}
            </Text>
            {formData.education.length > 1 && (
              <TouchableOpacity
                onPress={() => removeArrayItem('education', index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          <Input
            label="Institution *"
            value={edu.institution}
            onChangeText={(value) => updateFormData('education', 'institution', value, index)}
            placeholder="University Name"
          />
          <Input
            label="Degree *"
            value={edu.degree}
            onChangeText={(value) => updateFormData('education', 'degree', value, index)}
            placeholder="Bachelor of Science in Computer Science"
          />
          <Input
            label="Year *"
            value={edu.year}
            onChangeText={(value) => updateFormData('education', 'year', value, index)}
            placeholder="2020"
          />
          <Input
            label="GPA (Optional)"
            value={edu.gpa}
            onChangeText={(value) => updateFormData('education', 'gpa', value, index)}
            placeholder="3.8/4.0"
          />
        </Card>
      ))}

      <Button
        title="+ Add Education"
        onPress={() => addArrayItem('education')}
        variant="secondary"
        style={styles.addButton}
      />
    </View>
  );

  const renderSkills = () => (
    <View>
      <Input
        label="Skills *"
        value={formData.skills}
        onChangeText={(value) => updateFormData(null, 'skills', value)}
        placeholder="JavaScript, React, Node.js, Python, MongoDB, AWS..."
        multiline
        numberOfLines={3}
      />
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        Tip: Separate skills with commas. Include both technical and soft skills.
      </Text>
    </View>
  );

  const renderProjects = () => (
    <View>
      {formData.projects.map((project, index) => (
        <Card key={index} style={styles.arrayItem}>
          <View style={styles.arrayHeader}>
            <Text style={[styles.arrayTitle, { color: colors.text }]}>
              Project {index + 1}
            </Text>
            {formData.projects.length > 1 && (
              <TouchableOpacity
                onPress={() => removeArrayItem('projects', index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          <Input
            label="Project Name *"
            value={project.name}
            onChangeText={(value) => updateFormData('projects', 'name', value, index)}
            placeholder="E-commerce Website"
          />
          <Input
            label="Description *"
            value={project.description}
            onChangeText={(value) => updateFormData('projects', 'description', value, index)}
            placeholder="Describe what the project does and your role..."
            multiline
            numberOfLines={3}
          />
          <Input
            label="Technologies"
            value={project.technologies}
            onChangeText={(value) => updateFormData('projects', 'technologies', value, index)}
            placeholder="React, Node.js, MongoDB"
          />
          <Input
            label="Link (Optional)"
            value={project.link}
            onChangeText={(value) => updateFormData('projects', 'link', value, index)}
            placeholder="https://github.com/username/project"
          />
        </Card>
      ))}

      <Button
        title="+ Add Project"
        onPress={() => addArrayItem('projects')}
        variant="secondary"
        style={styles.addButton}
      />
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderSummary();
      case 2: return renderExperience();
      case 3: return renderEducation();
      case 4: return renderSkills();
      case 5: return renderProjects();
      case 6: return renderStyleSelection();
      default: return null;
    }
  };

  const handleEnhanceContent = async () => {
    try {
      setLoading(true);
      const payload = {
        summary: formData.summary,
        experience: formData.experience,
        projects: formData.projects
      };

      const response = await resumeAPI.enhanceResumeContent(payload);

      if (response.data.success) {
        const enhanced = response.data.data;
        setFormData(prev => ({
          ...prev,
          summary: enhanced.summary || prev.summary,
          experience: enhanced.experience || prev.experience,
          projects: enhanced.projects || prev.projects
        }));
        Alert.alert('Content Enhanced! ✨', 'Your resume content has been polished by AI. Please review the changes.');
      }
    } catch (error) {
      console.error('Enhancement failed', error);
      Alert.alert('Error', 'Failed to enhance content. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleGenerateSummary = async () => {
    if (formData.experience.length === 0 && !formData.skills) {
      Alert.alert('Info Needed', 'Please add some Experience or Skills first so AI can write a summary for you.');
      return;
    }

    try {
      setLoading(true);
      // Use enhance endpoint but with a flag or specific prompt context
      const payload = {
        summary: "GENERATE_NEW_SUMMARY", // Signal to backend
        experience: formData.experience,
        skills: formData.skills, // Include skills 
        projects: formData.projects
      };

      // We need to pass skills to backend for better summary, but enhanceResumeContent currently takes summary, experience, projects.
      // I will update the backend to accept skills too.

      const response = await resumeAPI.enhanceResumeContent(payload);

      if (response.data.success) {
        setFormData(prev => ({ ...prev, summary: response.data.data.summary }));
        Alert.alert('AI Summary Ready!', 'Review and edit the generated summary.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && <FancyLoader message="AI is working on your resume..." />}
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Build Resume with AI
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Steps */}
      <View style={[styles.stepsContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                {
                  backgroundColor: index <= currentStep ? colors.primary : colors.border,
                }
              ]}>
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={index <= currentStep ? '#FFFFFF' : colors.textSecondary}
                />
              </View>
              <Text style={[
                styles.stepText,
                {
                  color: index <= currentStep ? colors.primary : colors.textSecondary,
                }
              ]}>
                {step.title}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            {steps[currentStep].title}
          </Text>
          {renderStepContent()}
        </Card>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.surface }]}>
        <Button
          title="Previous"
          onPress={handlePrevious}
          variant="secondary"
          disabled={currentStep === 0}
          style={[styles.navButton, { opacity: currentStep === 0 ? 0.5 : 1 }]}
        />

        {/* Show Polish button on Summary (1), Experience (2), Projects (5) steps, or just globally before finish */}
        {(currentStep === 1 || currentStep === 2 || currentStep === 5) && (
          <Button
            title="AI Polish ✨"
            onPress={handleEnhanceContent}
            loading={loading}
            variant="outline" // Assuming outline variant exists, or secondary
            style={[styles.navButton, { borderColor: colors.primary }]}
            textStyle={{ color: colors.primary }}
          />
        )}

        <Button
          title={currentStep === steps.length - 1 ? 'Generate Resume' : 'Next'}
          onPress={handleNext}
          loading={loading}
          style={styles.navButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  stepsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  arrayItem: {
    marginBottom: 16,
  },
  arrayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrayTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    marginTop: 8,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ResumeBuildScreen;