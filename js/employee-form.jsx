const { useState, useEffect } = React;
const supabase = window.supabaseClient;

const EmployeeForm = ({ supabase, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_initial: '',
    last_name: '',
    ssn: '',
    date_of_birth: '',
    gender: '',
    hire_date: '',
    employee_id: '',
    address: '',
    address_line_2: '',
    city: '',
    state: 'NY',
    zip: '',
    email: '',
    mobile_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    dd_authorized: false,
    bank1_routing: '',
    bank1_account: '',
    bank1_type: 'checking',
    bank1_amount_type: 'percent',
    bank1_amount: '100',
    bank2_routing: '',
    bank2_account: '',
    bank2_type: 'checking',
    bank2_amount_type: 'percent',
    bank2_amount: '',
    w4_filing_status: 'single',
    w4_multiple_jobs: false,
    w4_dependents: '0',
    w4_other_income: '',
    w4_deductions: '',
    w4_extra_withholding: '',
    w4_exempt: false,
    w4_file_path: '',
    nyc_resident: false,
    yonkers_resident: false,
    it_filing_status: 'single',
    ny_allowances: '0',
    nyc_allowances: '',
    yonkers_allowances: '',
    ny_additional: '',
    nyc_additional: '',
    yonkers_additional: '',
    it2104_file_path: '',
    citizenship_status: 'citizen',
    other_last_names: '',
    uscis_number: '',
    i94_number: '',
    work_auth_expiration: '',
    foreign_passport: '',
    passport_country: '',
    i9_file_path: '',
    void_check_path: '',
    certify_accurate: false,
    e_signature: '',
    signature_date: new Date().toISOString().split('T')[0],
    employer_email: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const maskSSN = (ssn) => {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };

  const handleSSNChange = (value) => {
    const masked = maskSSN(value);
    handleInputChange('ssn', masked);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.ssn || formData.ssn.replace(/\D/g, '').length !== 9) {
        newErrors.ssn = 'Valid SSN is required';
      }
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Valid email is required';
      }
      if (!formData.mobile_phone.trim()) newErrors.mobile_phone = 'Mobile phone is required';
      if (!formData.emergency_contact_name.trim()) {
        newErrors.emergency_contact_name = 'Emergency contact name is required';
      }
      if (!formData.emergency_contact_phone.trim()) {
        newErrors.emergency_contact_phone = 'Emergency contact phone is required';
      }
      if (!formData.emergency_contact_relationship.trim()) {
        newErrors.emergency_contact_relationship = 'Relationship is required';
      }
    } else if (step === 2) {
      if (formData.dd_authorized) {
        if (!formData.bank1_routing.trim()) newErrors.bank1_routing = 'Routing number is required';
        if (!formData.bank1_account.trim()) newErrors.bank1_account = 'Account number is required';
        if (formData.bank1_amount_type === 'dollar' && !formData.bank1_amount) {
          newErrors.bank1_amount = 'Amount is required';
        }
        if (!formData.void_check_path) newErrors.void_check_path = 'Voided check is required';
      }
    } else if (step === 3) {
      if (!formData.w4_file_path) newErrors.w4_file_path = 'W-4 form is required';
    } else if (step === 4) {
      if (!formData.it2104_file_path) newErrors.it2104_file_path = 'IT-2104 form is required';
    } else if (step === 5) {
      if (!formData.i9_file_path) newErrors.i9_file_path = 'I-9 form is required';
      if (formData.citizenship_status === 'alien' && !formData.uscis_number) {
        newErrors.uscis_number = 'USCIS number is required for aliens';
      }
    } else if (step === 6) {
      if (!formData.employer_email.trim()) newErrors.employer_email = 'Employer email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employer_email)) {
        newErrors.employer_email = 'Valid employer email is required';
      }
    } else if (step === 7) {
      if (!formData.certify_accurate) {
        newErrors.certify_accurate = 'You must certify the information is accurate';
      }
      if (!formData.e_signature.trim()) {
        newErrors.e_signature = 'E-signature is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    try {
      setLoading(true);
      const filePath = `temp/${field}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('onboarding-documents')
        .upload(filePath, file);

      if (error) throw error;

      handleInputChange(field, filePath);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [field]: `Upload failed: ${error.message}`
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) return;

    try {
      setLoading(true);

      const dataToSubmit = {
        first_name: formData.first_name,
        middle_initial: formData.middle_initial,
        last_name: formData.last_name,
        ssn: formData.ssn.replace(/\D/g, ''),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        hire_date: formData.hire_date || null,
        employee_id: formData.employee_id || null,
        address: formData.address,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        email: formData.email,
        mobile_phone: formData.mobile_phone,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        dd_authorized: formData.dd_authorized,
        bank1_routing: formData.bank1_routing,
        bank1_account: formData.bank1_account,
        bank1_type: formData.bank1_type,
        bank1_amount_type: formData.bank1_amount_type,
        bank1_amount: formData.bank1_amount,
        bank2_routing: formData.bank2_routing,
        bank2_account: formData.bank2_account,
        bank2_type: formData.bank2_type,
        bank2_amount_type: formData.bank2_amount_type,
        bank2_amount: formData.bank2_amount,
        w4_filing_status: formData.w4_filing_status,
        w4_multiple_jobs: formData.w4_multiple_jobs,
        w4_dependents: formData.w4_dependents,
        w4_other_income: formData.w4_other_income,
        w4_deductions: formData.w4_deductions,
        w4_extra_withholding: formData.w4_extra_withholding,
        w4_exempt: formData.w4_exempt,
        w4_file_path: formData.w4_file_path,
        nyc_resident: formData.nyc_resident,
        yonkers_resident: formData.yonkers_resident,
        it_filing_status: formData.it_filing_status,
        ny_allowances: formData.ny_allowances,
        nyc_allowances: formData.nyc_allowances,
        yonkers_allowances: formData.yonkers_allowances,
        ny_additional: formData.ny_additional,
        nyc_additional: formData.nyc_additional,
        yonkers_additional: formData.yonkers_additional,
        it2104_file_path: formData.it2104_file_path,
        citizenship_status: formData.citizenship_status,
        other_last_names: formData.other_last_names,
        uscis_number: formData.uscis_number,
        i94_number: formData.i94_number,
        work_auth_expiration: formData.work_auth_expiration,
        foreign_passport: formData.foreign_passport,
        passport_country: formData.passport_country,
        i9_file_path: formData.i9_file_path,
        void_check_path: formData.void_check_path,
        certify_accurate: formData.certify_accurate,
        e_signature: formData.e_signature,
        signature_date: formData.signature_date,
        employer_email: formData.employer_email,
        status: 'draft'
      };

      const { data: submission, error: submitError } = await supabase
        .from('submissions')
        .insert([dataToSubmit])
        .select()
        .single();

      if (submitError) throw submitError;

      setSubmissionId(submission.id);

      const response = await supabase.functions.invoke('send-employer-link', {
        body: {
          submissionId: submission.id,
          employerEmail: formData.employer_email,
          employeeName: `${formData.first_name} ${formData.last_name}`
        }
      });

      if (response.error) throw response.error;

      setSubmitSuccess(true);
      if (onComplete) onComplete(submission);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Form Submitted Successfully</h1>
          <p style={styles.successMessage}>
            Your employee onboarding form has been submitted. An onboarding link has been sent to {formData.employer_email}.
          </p>
          <p style={styles.submissionId}>Submission ID: {submissionId}</p>
          <p style={styles.nextSteps}>
            The employer will complete Phase 2 with company information, position details, and tax notices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src="https://static.wixstatic.com/media/d0868f_5e34acd241394012b2beb2c576f16a62~mv2.png" alt="Logo" style={styles.logo} />
        <div style={styles.headerText}>
          <h1 style={styles.title}>Employee Onboarding Form</h1>
          <p style={styles.tagline}>Workforce Management Solutions</p>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          {[1, 2, 3, 4, 5, 6, 7].map(step => (
            <div
              key={step}
              style={{
                ...styles.progressStep,
                backgroundColor: step <= currentStep ? '#0052a3' : '#e0e0e0',
              }}
            >
              <span style={styles.stepNumber}>{step}</span>
            </div>
          ))}
        </div>
        <div style={styles.stepLabels}>
          {['Personal', 'Direct Deposit', 'W-4', 'IT-2104', 'I-9', 'Employer', 'Review'].map((label, idx) => (
            <span key={idx} style={styles.stepLabel}>{label}</span>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {currentStep === 1 && <PersonalInfoStep formData={formData} handleInputChange={handleInputChange} handleSSNChange={handleSSNChange} errors={errors} />}
        {currentStep === 2 && <DirectDepositStep formData={formData} handleInputChange={handleInputChange} handleFileUpload={handleFileUpload} errors={errors} />}
        {currentStep === 3 && <W4Step formData={formData} handleInputChange={handleInputChange} handleFileUpload={handleFileUpload} errors={errors} />}
        {currentStep === 4 && <IT2104Step formData={formData} handleInputChange={handleInputChange} handleFileUpload={handleFileUpload} errors={errors} />}
        {currentStep === 5 && <I9Step formData={formData} handleInputChange={handleInputChange} handleFileUpload={handleFileUpload} errors={errors} />}
        {currentStep === 6 && <EmployerEmailStep formData={formData} handleInputChange={handleInputChange} errors={errors} />}
        {currentStep === 7 && <ReviewStep formData={formData} handleInputChange={handleInputChange} errors={errors} />}
      </div>

      {errors.submit && (
        <div style={styles.errorBanner}>
          {errors.submit}
        </div>
      )}

      <div style={styles.navigation}>
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          style={{
            ...styles.button,
            ...styles.backButton,
            opacity: currentStep === 1 ? 0.5 : 1,
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Back
        </button>
        {currentStep < 7 && (
          <button
            onClick={handleContinue}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.continueButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Continue'}
          </button>
        )}
        {currentStep === 7 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
};

// Step Components
const PersonalInfoStep = ({ formData, handleInputChange, handleSSNChange, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>Personal Information</h2>
    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>First Name *</label>
        <input
          type="text"
          value={formData.first_name}
          onChange={(e) => handleInputChange('first_name', e.target.value)}
          style={{...styles.input, borderColor: errors.first_name ? '#d32f2f' : '#ccc'}}
          placeholder="John"
        />
        {errors.first_name && <span style={styles.error}>{errors.first_name}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Middle Initial</label>
        <input
          type="text"
          maxLength="1"
          value={formData.middle_initial}
          onChange={(e) => handleInputChange('middle_initial', e.target.value.toUpperCase())}
          style={styles.input}
          placeholder="J"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Last Name *</label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) => handleInputChange('last_name', e.target.value)}
          style={{...styles.input, borderColor: errors.last_name ? '#d32f2f' : '#ccc'}}
          placeholder="Doe"
        />
        {errors.last_name && <span style={styles.error}>{errors.last_name}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Social Security Number *</label>
        <input
          type="text"
          value={formData.ssn}
          onChange={(e) => handleSSNChange(e.target.value)}
          style={{...styles.input, borderColor: errors.ssn ? '#d32f2f' : '#ccc'}}
          placeholder="XXX-XX-XXXX"
        />
        {errors.ssn && <span style={styles.error}>{errors.ssn}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Date of Birth *</label>
        <input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          style={{...styles.input, borderColor: errors.date_of_birth ? '#d32f2f' : '#ccc'}}
        />
        {errors.date_of_birth && <span style={styles.error}>{errors.date_of_birth}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Gender *</label>
        <select
          value={formData.gender}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          style={{...styles.input, borderColor: errors.gender ? '#d32f2f' : '#ccc'}}
        >
          <option value="">Select</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
          <option value="P">Prefer not to say</option>
        </select>
        {errors.gender && <span style={styles.error}>{errors.gender}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Address *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          style={{...styles.input, borderColor: errors.address ? '#d32f2f' : '#ccc'}}
          placeholder="123 Main St"
        />
        {errors.address && <span style={styles.error}>{errors.address}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Address Line 2</label>
        <input
          type="text"
          value={formData.address_line_2}
          onChange={(e) => handleInputChange('address_line_2', e.target.value)}
          style={styles.input}
          placeholder="Apt, Suite, etc."
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>City *</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          style={{...styles.input, borderColor: errors.city ? '#d32f2f' : '#ccc'}}
          placeholder="New York"
        />
        {errors.city && <span style={styles.error}>{errors.city}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>State *</label>
        <input
          type="text"
          value={formData.state}
          onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
          maxLength="2"
          style={{...styles.input, borderColor: errors.state ? '#d32f2f' : '#ccc'}}
          placeholder="NY"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>ZIP Code *</label>
        <input
          type="text"
          value={formData.zip}
          onChange={(e) => handleInputChange('zip', e.target.value)}
          style={{...styles.input, borderColor: errors.zip ? '#d32f2f' : '#ccc'}}
          placeholder="10001"
        />
        {errors.zip && <span style={styles.error}>{errors.zip}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          style={{...styles.input, borderColor: errors.email ? '#d32f2f' : '#ccc'}}
          placeholder="john@example.com"
        />
        {errors.email && <span style={styles.error}>{errors.email}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Mobile Phone *</label>
        <input
          type="tel"
          value={formData.mobile_phone}
          onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
          style={{...styles.input, borderColor: errors.mobile_phone ? '#d32f2f' : '#ccc'}}
          placeholder="(555) 123-4567"
        />
        {errors.mobile_phone && <span style={styles.error}>{errors.mobile_phone}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Emergency Contact Name *</label>
        <input
          type="text"
          value={formData.emergency_contact_name}
          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
          style={{...styles.input, borderColor: errors.emergency_contact_name ? '#d32f2f' : '#ccc'}}
          placeholder="Jane Doe"
        />
        {errors.emergency_contact_name && <span style={styles.error}>{errors.emergency_contact_name}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Emergency Contact Phone *</label>
        <input
          type="tel"
          value={formData.emergency_contact_phone}
          onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
          style={{...styles.input, borderColor: errors.emergency_contact_phone ? '#d32f2f' : '#ccc'}}
          placeholder="(555) 987-6543"
        />
        {errors.emergency_contact_phone && <span style={styles.error}>{errors.emergency_contact_phone}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Relationship *</label>
        <input
          type="text"
          value={formData.emergency_contact_relationship}
          onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
          style={{...styles.input, borderColor: errors.emergency_contact_relationship ? '#d32f2f' : '#ccc'}}
          placeholder="Spouse, Parent, Sibling, etc."
        />
        {errors.emergency_contact_relationship && <span style={styles.error}>{errors.emergency_contact_relationship}</span>}
      </div>
    </div>
  </div>
);

const DirectDepositStep = ({ formData, handleInputChange, handleFileUpload, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>Direct Deposit</h2>

    <div style={styles.checkboxGroup}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={formData.dd_authorized}
          onChange={(e) => handleInputChange('dd_authorized', e.target.checked)}
          style={styles.checkbox}
        />
        I authorize direct deposit of my paycheck
      </label>
    </div>

    {formData.dd_authorized && (
      <>
        <h3 style={styles.subTitle}>Bank Account 1 (Primary) *</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Routing Number *</label>
            <input
              type="text"
              value={formData.bank1_routing}
              onChange={(e) => handleInputChange('bank1_routing', e.target.value)}
              style={{...styles.input, borderColor: errors.bank1_routing ? '#d32f2f' : '#ccc'}}
              placeholder="000000000"
            />
            {errors.bank1_routing && <span style={styles.error}>{errors.bank1_routing}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Account Number *</label>
            <input
              type="password"
              value={formData.bank1_account}
              onChange={(e) => handleInputChange('bank1_account', e.target.value)}
              style={{...styles.input, borderColor: errors.bank1_account ? '#d32f2f' : '#ccc'}}
              placeholder="••••••••"
            />
            {errors.bank1_account && <span style={styles.error}>{errors.bank1_account}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Account Type *</label>
            <select
              value={formData.bank1_type}
              onChange={(e) => handleInputChange('bank1_type', e.target.value)}
              style={styles.input}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Distribution Type *</label>
            <select
              value={formData.bank1_amount_type}
              onChange={(e) => handleInputChange('bank1_amount_type', e.target.value)}
              style={styles.input}
            >
              <option value="percent">Percentage</option>
              <option value="dollar">Dollar Amount</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount *</label>
            <input
              type="text"
              value={formData.bank1_amount}
              onChange={(e) => handleInputChange('bank1_amount', e.target.value)}
              style={styles.input}
              placeholder={formData.bank1_amount_type === 'percent' ? '100' : '0.00'}
            />
          </div>
        </div>

        <h3 style={styles.subTitle}>Bank Account 2 (Optional)</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Routing Number</label>
            <input
              type="text"
              value={formData.bank2_routing}
              onChange={(e) => handleInputChange('bank2_routing', e.target.value)}
              style={styles.input}
              placeholder="000000000"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Account Number</label>
            <input
              type="password"
              value={formData.bank2_account}
              onChange={(e) => handleInputChange('bank2_account', e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Account Type</label>
            <select
              value={formData.bank2_type}
              onChange={(e) => handleInputChange('bank2_type', e.target.value)}
              style={styles.input}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Distribution Type</label>
            <select
              value={formData.bank2_amount_type}
              onChange={(e) => handleInputChange('bank2_amount_type', e.target.value)}
              style={styles.input}
            >
              <option value="percent">Percentage</option>
              <option value="dollar">Dollar Amount</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount</label>
            <input
              type="text"
              value={formData.bank2_amount}
              onChange={(e) => handleInputChange('bank2_amount', e.target.value)}
              style={styles.input}
              placeholder={formData.bank2_amount_type === 'percent' ? '0' : '0.00'}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Voided Check *</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload('void_check_path', e.target.files[0])}
            style={styles.fileInput}
          />
          {formData.void_check_path && <span style={styles.uploadSuccess}>✓ Uploaded</span>}
          {errors.void_check_path && <span style={styles.error}>{errors.void_check_path}</span>}
        </div>
      </>
    )}
  </div>
);

const W4Step = ({ formData, handleInputChange, handleFileUpload, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>Federal Tax Withholding (W-4)</h2>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Filing Status *</label>
        <select
          value={formData.w4_filing_status}
          onChange={(e) => handleInputChange('w4_filing_status', e.target.value)}
          style={styles.input}
        >
          <option value="single">Single</option>
          <option value="married">Married Filing Jointly</option>
          <option value="married_separate">Married Filing Separately</option>
          <option value="head_of_household">Head of Household</option>
          <option value="qualifying_widow">Qualifying Widow(er)</option>
        </select>
      </div>

      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.w4_multiple_jobs}
            onChange={(e) => handleInputChange('w4_multiple_jobs', e.target.checked)}
            style={styles.checkbox}
          />
          Multiple jobs or spouse works
        </label>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Number of Dependents</label>
        <input
          type="number"
          value={formData.w4_dependents}
          onChange={(e) => handleInputChange('w4_dependents', e.target.value)}
          style={styles.input}
          min="0"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Other Income</label>
        <input
          type="text"
          value={formData.w4_other_income}
          onChange={(e) => handleInputChange('w4_other_income', e.target.value)}
          style={styles.input}
          placeholder="0.00"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Deductions</label>
        <input
          type="text"
          value={formData.w4_deductions}
          onChange={(e) => handleInputChange('w4_deductions', e.target.value)}
          style={styles.input}
          placeholder="0.00"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Extra Withholding per Paycheck</label>
        <input
          type="text"
          value={formData.w4_extra_withholding}
          onChange={(e) => handleInputChange('w4_extra_withholding', e.target.value)}
          style={styles.input}
          placeholder="0.00"
        />
      </div>

      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.w4_exempt}
            onChange={(e) => handleInputChange('w4_exempt', e.target.checked)}
            style={styles.checkbox}
          />
          I claim exemption from withholding
        </label>
      </div>
    </div>

    <div style={styles.pdfViewer}>
      <h3 style={styles.subTitle}>W-4 Form (PDF)</h3>
      <iframe
        src="https://docs.google.com/viewer?url=https://www.irs.gov/pub/irs-pdf/fw4.pdf&embedded=true"
        style={styles.pdfFrame}
        title="W-4 Form"
      ></iframe>
      <div style={styles.formGroup}>
        <label style={styles.label}>Upload Completed W-4 *</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload('w4_file_path', e.target.files[0])}
          style={styles.fileInput}
        />
        {formData.w4_file_path && <span style={styles.uploadSuccess}>✓ Uploaded</span>}
        {errors.w4_file_path && <span style={styles.error}>{errors.w4_file_path}</span>}
      </div>
    </div>
  </div>
);

const IT2104Step = ({ formData, handleInputChange, handleFileUpload, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>New York State Tax Withholding (IT-2104)</h2>

    <div style={styles.formGrid}>
      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.nyc_resident}
            onChange={(e) => handleInputChange('nyc_resident', e.target.checked)}
            style={styles.checkbox}
          />
          New York City resident
        </label>
      </div>

      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.yonkers_resident}
            onChange={(e) => handleInputChange('yonkers_resident', e.target.checked)}
            style={styles.checkbox}
          />
          Yonkers resident
        </label>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Filing Status *</label>
        <select
          value={formData.it_filing_status}
          onChange={(e) => handleInputChange('it_filing_status', e.target.value)}
          style={styles.input}
        >
          <option value="single">Single</option>
          <option value="married">Married Filing Jointly</option>
          <option value="married_separate">Married Filing Separately</option>
          <option value="head_of_household">Head of Household</option>
          <option value="dependent">Dependent</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>NY State Allowances</label>
        <input
          type="number"
          value={formData.ny_allowances}
          onChange={(e) => handleInputChange('ny_allowances', e.target.value)}
          style={styles.input}
          min="0"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>NYC Allowances</label>
        <input
          type="number"
          value={formData.nyc_allowances}
          onChange={(e) => handleInputChange('nyc_allowances', e.target.value)}
          style={styles.input}
          min="0"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Yonkers Allowances</label>
        <input
          type="number"
          value={formData.yonkers_allowances}
          onChange={(e) => handleInputChange('yonkers_allowances', e.target.value)}
          style={styles.input}
          min="0"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>NY Additional Withholding</label>
        <input
          type="text"
          value={formData.ny_additional}
          onChange={(e) => handleInputChange('ny_additional', e.target.value)}
          style={styles.input}
          placeholder="0.00"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>NYC Additional Withholding</label>
        <input
          type="text"
          value={formData.nyc_additional}
          onChange={(e) => handleInputChange('nyc_additional', e.target.value)}
          style={styles.input}
          placeholder="0.00"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Yonkers Additional Withholding</label>
        <input
          type="text"
          value={formData.yonkers_additional}
          onChange={(e) => handleInputChange('yonkers_additional', e.target.value)}
          style={styles.input}
          placeholder="0.00"
        />
      </div>
    </div>

    <div style={styles.pdfViewer}>
      <h3 style={styles.subTitle}>IT-2104 Form (PDF)</h3>
      <iframe
        src="https://docs.google.com/viewer?url=https://www.tax.ny.gov/pdf/current_forms/it/it2104_fill_in.pdf&embedded=true"
        style={styles.pdfFrame}
        title="IT-2104 Form"
      ></iframe>
      <div style={styles.formGroup}>
        <label style={styles.label}>Upload Completed IT-2104 *</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload('it2104_file_path', e.target.files[0])}
          style={styles.fileInput}
        />
        {formData.it2104_file_path && <span style={styles.uploadSuccess}>✓ Uploaded</span>}
        {errors.it2104_file_path && <span style={styles.error}>{errors.it2104_file_path}</span>}
      </div>
    </div>
  </div>
);

const I9Step = ({ formData, handleInputChange, handleFileUpload, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>Employment Eligibility (I-9)</h2>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Citizenship Status *</label>
        <select
          value={formData.citizenship_status}
          onChange={(e) => handleInputChange('citizenship_status', e.target.value)}
          style={styles.input}
        >
          <option value="citizen">U.S. Citizen</option>
          <option value="national">U.S. National</option>
          <option value="alien">Lawful Permanent Resident (Green Card)</option>
          <option value="authorized_alien">Authorized to Work</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Other Last Names</label>
        <input
          type="text"
          value={formData.other_last_names}
          onChange={(e) => handleInputChange('other_last_names', e.target.value)}
          style={styles.input}
          placeholder="Maiden name, former names, etc."
        />
      </div>

      {(formData.citizenship_status === 'alien' || formData.citizenship_status === 'authorized_alien') && (
        <>
          <div style={styles.formGroup}>
            <label style={styles.label}>USCIS Number *</label>
            <input
              type="text"
              value={formData.uscis_number}
              onChange={(e) => handleInputChange('uscis_number', e.target.value)}
              style={{...styles.input, borderColor: errors.uscis_number ? '#d32f2f' : '#ccc'}}
              placeholder="123456789"
            />
            {errors.uscis_number && <span style={styles.error}>{errors.uscis_number}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>I-94 Number</label>
            <input
              type="text"
              value={formData.i94_number}
              onChange={(e) => handleInputChange('i94_number', e.target.value)}
              style={styles.input}
              placeholder="123456789"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Work Authorization Expiration Date</label>
            <input
              type="date"
              value={formData.work_auth_expiration}
              onChange={(e) => handleInputChange('work_auth_expiration', e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Foreign Passport Number</label>
            <input
              type="text"
              value={formData.foreign_passport}
              onChange={(e) => handleInputChange('foreign_passport', e.target.value)}
              style={styles.input}
              placeholder="ABC123456"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Passport Country</label>
            <input
              type="text"
              value={formData.passport_country}
              onChange={(e) => handleInputChange('passport_country', e.target.value)}
              style={styles.input}
              placeholder="United Kingdom"
            />
          </div>
        </>
      )}
    </div>

    <div style={styles.pdfViewer}>
      <h3 style={styles.subTitle}>I-9 Form (PDF)</h3>
      <iframe
        src="https://docs.google.com/viewer?url=https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf&embedded=true"
        style={styles.pdfFrame}
        title="I-9 Form"
      ></iframe>
      <div style={styles.formGroup}>
        <label style={styles.label}>Upload Completed I-9 *</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload('i9_file_path', e.target.files[0])}
          style={styles.fileInput}
        />
        {formData.i9_file_path && <span style={styles.uploadSuccess}>✓ Uploaded</span>}
        {errors.i9_file_path && <span style={styles.error}>{errors.i9_file_path}</span>}
      </div>
    </div>
  </div>
);

const EmployerEmailStep = ({ formData, handleInputChange, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>Employer Information</h2>
    <p style={styles.stepDescription}>
      Enter your employer's email address. An onboarding link will be sent to them to complete Phase 2.
    </p>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Employer Email Address *</label>
        <input
          type="email"
          value={formData.employer_email}
          onChange={(e) => handleInputChange('employer_email', e.target.value)}
          style={{...styles.input, borderColor: errors.employer_email ? '#d32f2f' : '#ccc'}}
          placeholder="hr@company.com"
        />
        {errors.employer_email && <span style={styles.error}>{errors.employer_email}</span>}
        <p style={styles.helpText}>
          The employer will receive a link to access Phase 2 of the onboarding process where they will enter company information and position details.
        </p>
      </div>
    </div>
  </div>
);

const ReviewStep = ({ formData, handleInputChange, errors }) => (
  <div>
    <h2 style={styles.stepTitle}>Review & Sign</h2>

    <div style={styles.reviewSection}>
      <h3 style={styles.subTitle}>Personal Information</h3>
      <p><strong>Name:</strong> {formData.first_name} {formData.middle_initial} {formData.last_name}</p>
      <p><strong>SSN:</strong> {formData.ssn}</p>
      <p><strong>Date of Birth:</strong> {formData.date_of_birth}</p>
      <p><strong>Address:</strong> {formData.address} {formData.address_line_2}, {formData.city}, {formData.state} {formData.zip}</p>
      <p><strong>Email:</strong> {formData.email}</p>
      <p><strong>Mobile:</strong> {formData.mobile_phone}</p>
      <p><strong>Emergency Contact:</strong> {formData.emergency_contact_name} ({formData.emergency_contact_relationship}) - {formData.emergency_contact_phone}</p>
    </div>

    {formData.dd_authorized && (
      <div style={styles.reviewSection}>
        <h3 style={styles.subTitle}>Direct Deposit</h3>
        <p><strong>Authorized:</strong> Yes</p>
        <p><strong>Bank 1:</strong> {formData.bank1_type} ending in {formData.bank1_account.slice(-4)} ({formData.bank1_amount}{formData.bank1_amount_type === 'percent' ? '%' : ''})</p>
      </div>
    )}

    <div style={styles.reviewSection}>
      <h3 style={styles.subTitle}>Tax Withholding</h3>
      <p><strong>W-4 Status:</strong> {formData.w4_file_path ? '✓ Uploaded' : 'Pending'}</p>
      <p><strong>IT-2104 Status:</strong> {formData.it2104_file_path ? '✓ Uploaded' : 'Pending'}</p>
    </div>

    <div style={styles.reviewSection}>
      <h3 style={styles.subTitle}>I-9 Status</h3>
      <p><strong>Citizenship:</strong> {formData.citizenship_status}</p>
      <p><strong>Form Status:</strong> {formData.i9_file_path ? '✓ Uploaded' : 'Pending'}</p>
    </div>

    <div style={styles.reviewSection}>
      <h3 style={styles.subTitle}>Employer</h3>
      <p><strong>Employer Email:</strong> {formData.employer_email}</p>
    </div>

    <div style={styles.signatureSection}>
      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.certify_accurate}
            onChange={(e) => handleInputChange('certify_accurate', e.target.checked)}
            style={styles.checkbox}
          />
          I certify that all information provided is true and accurate
        </label>
        {errors.certify_accurate && <span style={styles.error}>{errors.certify_accurate}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Electronic Signature *</label>
        <input
          type="text"
          value={formData.e_signature}
          onChange={(e) => handleInputChange('e_signature', e.target.value)}
          style={{...styles.input, borderColor: errors.e_signature ? '#d32f2f' : '#ccc'}}
          placeholder="Type your full name"
        />
        {errors.e_signature && <span style={styles.error}>{errors.e_signature}</span>}
        <p style={styles.helpText}>By typing your name, you are signing this form electronically.</p>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Signature Date</label>
        <input
          type="date"
          value={formData.signature_date}
          onChange={(e) => handleInputChange('signature_date', e.target.value)}
          style={styles.input}
          disabled
        />
      </div>
    </div>
  </div>
);


// Export to global scope for App component
window.EmployeeForm = EmployeeForm;