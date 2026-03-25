const { useState, useEffect } = React;
const supabase = window.supabaseClient;

const EmployerForm = ({ supabase, token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showPayNotice, setShowPayNotice] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const [formData, setFormData] = useState({
    company_code: '',
    legal_name: '',
    ein: '',
    hire_type: '',
    employee_type: '',
    job_title: '',
    department: '',
    supervisor_name: '',
    work_location: '',
    pay_frequency: '',
    is_exempt: '',
    annual_salary: '',
    hourly_rate: '',
    standard_hours_per_week: '',
    employer_name: '',
    employer_dba: '',
    employer_fein: '',
    employer_address: '',
    employer_phone: '',
    regular_payday: '',
    allowances_taken: false,
    tip_allowance: false,
    meal_allowance: false,
    lodging_allowance: false,
    primary_language: '',
    other_language: '',
    pay_notice_file_path: '',
  });

  // Validation rules per step
  const validateStep = (step) => {
    const errors = [];
    if (step === 2) {
      if (!formData.company_code.trim()) errors.push('Company Code is required');
      if (!formData.legal_name.trim()) errors.push('Legal Company Name is required');
      if (!formData.ein.trim()) errors.push('EIN is required');
      if (!formData.hire_type) errors.push('Hire Type is required');
      if (!formData.employee_type) errors.push('Employee Type is required');
    }
    if (step === 3) {
      if (!formData.job_title.trim()) errors.push('Job Title is required');
      if (!formData.work_location.trim()) errors.push('Work Location is required');
      if (!formData.pay_frequency) errors.push('Pay Frequency is required');
      if (!formData.is_exempt) errors.push('Exempt Status is required');
      if (formData.is_exempt === 'true' && !formData.annual_salary) errors.push('Annual Salary is required for exempt employees');
      if (formData.is_exempt === 'false' && !formData.hourly_rate) errors.push('Hourly Rate is required for non-exempt employees');
      if (formData.is_exempt === 'false' && !formData.standard_hours_per_week) errors.push('Standard Hours per Week is required for non-exempt employees');
    }
    if (step === 4) {
      if (!formData.employer_name.trim()) errors.push('Employer Name is required');
      if (!formData.employer_fein.trim()) errors.push('FEIN is required');
      if (!formData.employer_address.trim()) errors.push('Business Address is required');
      if (!formData.employer_phone.trim()) errors.push('Business Phone is required');
      if (!formData.regular_payday.trim()) errors.push('Regular Payday is required');
      if (!formData.primary_language) errors.push('Primary Language is required');
    }
    return errors;
  };

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setError('Invalid access token. Please check your link.');
          setLoading(false);
          return;
        }

        console.log('[EmployerForm] Loading submission for token:', token);

        const { data, error: queryError } = await supabase
          .from('submissions')
          .select('*')
          .eq('employer_token', token)
          .eq('status', 'employee_complete')
          .single();

        if (queryError) {
          console.error('[EmployerForm] Query error:', queryError);
          setError('Invalid, expired, or already used token. Please request a new link from the employee.');
          setLoading(false);
          return;
        }

        if (!data) {
          console.error('[EmployerForm] No data returned for token');
          setError('Invalid, expired, or already used token. Please request a new link from the employee.');
          setLoading(false);
          return;
        }

        console.log('[EmployerForm] Submission loaded:', data.id, 'status:', data.status);
        setSubmission(data);

        if (data) {
          setFormData(prev => ({
            ...prev,
            company_code: data.company_code || '',
            legal_name: data.legal_name || '',
            ein: data.ein || '',
            hire_type: data.hire_type || '',
            employee_type: data.employee_type || '',
            job_title: data.job_title || '',
            department: data.department || '',
            supervisor_name: data.supervisor_name || '',
            work_location: data.work_location || '',
            pay_frequency: data.pay_frequency || '',
            is_exempt: data.is_exempt !== null && data.is_exempt !== undefined ? String(data.is_exempt) : '',
            annual_salary: data.annual_salary || '',
            hourly_rate: data.hourly_rate || '',
            standard_hours_per_week: data.standard_hours_per_week || '',
            employer_name: data.employer_name || '',
            employer_dba: data.employer_dba || '',
            employer_fein: data.employer_fein || '',
            employer_address: data.employer_address || '',
            employer_phone: data.employer_phone || '',
            regular_payday: data.regular_payday || '',
            allowances_taken: data.allowances_taken || false,
            tip_allowance: data.tip_allowance || false,
            meal_allowance: data.meal_allowance || false,
            lodging_allowance: data.lodging_allowance || false,
            primary_language: data.primary_language || '',
            other_language: data.other_language || '',
            pay_notice_file_path: data.pay_notice_file_path || '',
          }));
        }

        setLoading(false);
      } catch (err) {
        console.error('[EmployerForm] Load error:', err);
        setError(`Error loading submission: ${err.message}`);
        setLoading(false);
      }
    };

    loadSubmission();
  }, [token, supabase]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const maskSSN = (ssn) => {
    if (!ssn) return '';
    return `***-**-${ssn.slice(-4)}`;
  };

  const maskBankAccount = (account) => {
    if (!account) return '';
    return `****${account.slice(-4)}`;
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Not specified';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleNext = () => {
    // Step 1 is review-only, no validation needed
    if (currentStep === 1) {
      setValidationErrors([]);
      setCurrentStep(2);
      window.scrollTo(0, 0);
      return;
    }

    // Validate current step
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo(0, 0);
      return;
    }

    setValidationErrors([]);
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevious = () => {
    setValidationErrors([]);
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setValidationErrors([]);

      console.log('[EmployerForm] Submitting update for submission:', submission.id);
      console.log('[EmployerForm] Form data:', JSON.stringify(formData, null, 2));

      const updatePayload = {
        company_code: formData.company_code,
        legal_name: formData.legal_name,
        ein: formData.ein,
        hire_type: formData.hire_type,
        employee_type: formData.employee_type,
        job_title: formData.job_title,
        department: formData.department,
        supervisor_name: formData.supervisor_name,
        work_location: formData.work_location,
        pay_frequency: formData.pay_frequency,
        is_exempt: formData.is_exempt === '' ? null : formData.is_exempt === 'true',
        annual_salary: formData.annual_salary ? parseFloat(formData.annual_salary) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        standard_hours_per_week: formData.standard_hours_per_week ? parseFloat(formData.standard_hours_per_week) : null,
        employer_name: formData.employer_name,
        employer_dba: formData.employer_dba,
        employer_fein: formData.employer_fein,
        employer_address: formData.employer_address,
        employer_phone: formData.employer_phone,
        regular_payday: formData.regular_payday,
        allowances_taken: formData.allowances_taken,
        tip_allowance: formData.tip_allowance,
        meal_allowance: formData.meal_allowance,
        lodging_allowance: formData.lodging_allowance,
        primary_language: formData.primary_language,
        other_language: formData.other_language,
        pay_notice_file_path: formData.pay_notice_file_path,
        status: 'employer_complete',
        employer_submitted_at: new Date().toISOString(),
      };

      console.log('[EmployerForm] Update payload:', JSON.stringify(updatePayload, null, 2));

      const { data: updateData, error: updateError } = await supabase
        .from('submissions')
        .update(updatePayload)
        .eq('id', submission.id)
        .select();

      console.log('[EmployerForm] Update result - data:', updateData, 'error:', updateError);

      if (updateError) {
        console.error('[EmployerForm] Update error:', updateError);
        setError(`Failed to update submission: ${updateError.message}`);
        setSubmitting(false);
        return;
      }

      // Check if the update actually affected a row
      if (!updateData || updateData.length === 0) {
        console.error('[EmployerForm] Update returned no rows — possible RLS policy rejection');
        setError('Submission could not be saved. The link may have expired or already been used. Please request a new employer link.');
        setSubmitting(false);
        return;
      }

      console.log('[EmployerForm] Update successful, row returned:', updateData[0]?.id);

      // notify-new-hire is triggered automatically by the database trigger
      // on_employer_complete_notify when status changes to 'employer_complete'

      setSubmitting(false);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('[EmployerForm] Submit exception:', err);
      setError(`Error submitting form: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={employerStyles.container}>
        <div style={employerStyles.center}>
          <div style={employerStyles.spinner}></div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div style={employerStyles.container}>
        <div style={employerStyles.errorBox}>
          <h2>Unable to Access Form</h2>
          <p>{error}</p>
          <p>If you believe this is an error, please contact your HR department.</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div style={employerStyles.container}>
        <div style={employerStyles.successBox}>
          <div style={employerStyles.successIcon}>&#10003;</div>
          <h2>Form Submitted Successfully</h2>
          <p>Thank you for completing the employer information. Your submission has been received and processed.</p>
          <p style={employerStyles.successSubtext}>
            The employee will be notified that their onboarding is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={employerStyles.container}>
      <div style={employerStyles.header}>
        <img
          src="https://static.wixstatic.com/media/d0868f_5e34acd241394012b2beb2c576f16a62~mv2.png"
          alt="Logo"
          style={employerStyles.logo}
        />
        <h1>Employer Onboarding</h1>
        <p>Phase 2: Company &amp; Position Information</p>
      </div>

      <div style={employerStyles.progressBar}>
        {[1, 2, 3, 4, 5].map(step => (
          <div
            key={step}
            style={{
              ...employerStyles.progressStep,
              backgroundColor: step <= currentStep ? '#0052a3' : '#e0e0e0',
              color: step <= currentStep ? 'white' : '#666',
            }}
          >
            {step}
          </div>
        ))}
      </div>

      {validationErrors.length > 0 && (
        <div style={employerStyles.validationBanner}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Please fix the following before continuing:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {validationErrors.map((err, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div style={employerStyles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      <div style={employerStyles.form}>
        {currentStep === 1 && (
          <div style={employerStyles.step}>
            <h2>Employee Information Summary</h2>
            <p style={employerStyles.stepDescription}>Review the employee information provided. Some fields are masked for privacy.</p>

            <div style={employerStyles.summaryGrid}>
              <div style={employerStyles.summaryField}>
                <label>First Name</label>
                <p style={employerStyles.summaryValue}>{submission?.first_name}</p>
              </div>
              <div style={employerStyles.summaryField}>
                <label>Last Name</label>
                <p style={employerStyles.summaryValue}>{submission?.last_name}</p>
              </div>
              <div style={employerStyles.summaryField}>
                <label>Email</label>
                <p style={employerStyles.summaryValue}>{submission?.email}</p>
              </div>
              <div style={employerStyles.summaryField}>
                <label>Phone</label>
                <p style={employerStyles.summaryValue}>{submission?.mobile_phone}</p>
              </div>
              <div style={employerStyles.summaryField}>
                <label>SSN</label>
                <p style={employerStyles.summaryValue}>{maskSSN(submission?.ssn)}</p>
              </div>
              <div style={employerStyles.summaryField}>
                <label>Date of Birth</label>
                <p style={employerStyles.summaryValue}>
                  {submission?.date_of_birth ? new Date(submission.date_of_birth).toLocaleDateString() : ''}
                </p>
              </div>
            </div>

            {submission?.dd_authorized && (
              <div style={employerStyles.bankAccountsSection}>
                <h3>Bank Accounts</h3>
                <div style={employerStyles.bankAccount}>
                  <p><strong>Account Type:</strong> {submission.bank1_type}</p>
                  <p><strong>Account:</strong> {maskBankAccount(submission.bank1_account)}</p>
                  <p><strong>Distribution:</strong> {submission.bank1_amount}{submission.bank1_amount_type === 'percent' ? '%' : ''}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div style={employerStyles.step}>
            <h2>Company Information</h2>

            <div style={employerStyles.formGroup}>
              <label>Company Code <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="company_code"
                value={formData.company_code}
                onChange={handleInputChange}
                placeholder="e.g., ABC-2025"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Legal Company Name <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleInputChange}
                placeholder="Full legal company name"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>EIN (Employer Identification Number) <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="ein"
                value={formData.ein}
                onChange={handleInputChange}
                placeholder="00-0000000"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formRow}>
              <div style={employerStyles.formGroup}>
                <label>Hire Type <span style={{color:'#d32f2f'}}>*</span></label>
                <select
                  name="hire_type"
                  value={formData.hire_type}
                  onChange={handleInputChange}
                  style={employerStyles.input}
                >
                  <option value="">Select...</option>
                  <option value="new">New Hire</option>
                  <option value="rehire">Rehire</option>
                  <option value="transfer">Internal Transfer</option>
                </select>
              </div>

              <div style={employerStyles.formGroup}>
                <label>Employee Type <span style={{color:'#d32f2f'}}>*</span></label>
                <select
                  name="employee_type"
                  value={formData.employee_type}
                  onChange={handleInputChange}
                  style={employerStyles.input}
                >
                  <option value="">Select...</option>
                  <option value="full_time">Full-Time</option>
                  <option value="part_time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div style={employerStyles.step}>
            <h2>Position &amp; Pay Information</h2>

            <div style={employerStyles.formGroup}>
              <label>Job Title <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Engineering"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Supervisor Name</label>
              <input
                type="text"
                name="supervisor_name"
                value={formData.supervisor_name}
                onChange={handleInputChange}
                placeholder="Direct supervisor name"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Work Location <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="work_location"
                value={formData.work_location}
                onChange={handleInputChange}
                placeholder="e.g., New York, NY Office"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formRow}>
              <div style={employerStyles.formGroup}>
                <label>Pay Frequency <span style={{color:'#d32f2f'}}>*</span></label>
                <select
                  name="pay_frequency"
                  value={formData.pay_frequency}
                  onChange={handleInputChange}
                  style={employerStyles.input}
                >
                  <option value="">Select...</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="semimonthly">Semi-monthly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={employerStyles.formGroup}>
                <label>Exempt Status <span style={{color:'#d32f2f'}}>*</span></label>
                <select
                  name="is_exempt"
                  value={formData.is_exempt}
                  onChange={handleInputChange}
                  style={employerStyles.input}
                >
                  <option value="">Select...</option>
                  <option value="true">Exempt (Salary)</option>
                  <option value="false">Non-Exempt (Hourly)</option>
                </select>
              </div>
            </div>

            {formData.is_exempt === 'true' && (
              <div style={employerStyles.formGroup}>
                <label>Annual Salary <span style={{color:'#d32f2f'}}>*</span></label>
                <input
                  type="number"
                  name="annual_salary"
                  value={formData.annual_salary}
                  onChange={handleInputChange}
                  placeholder="e.g., 75000"
                  step="0.01"
                  style={employerStyles.input}
                />
              </div>
            )}

            {formData.is_exempt === 'false' && (
              <div style={employerStyles.formRow}>
                <div style={employerStyles.formGroup}>
                  <label>Hourly Rate <span style={{color:'#d32f2f'}}>*</span></label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    placeholder="e.g., 25.00"
                    step="0.01"
                    style={employerStyles.input}
                  />
                </div>

                <div style={employerStyles.formGroup}>
                  <label>Standard Hours per Week <span style={{color:'#d32f2f'}}>*</span></label>
                  <input
                    type="number"
                    name="standard_hours_per_week"
                    value={formData.standard_hours_per_week}
                    onChange={handleInputChange}
                    placeholder="e.g., 40"
                    step="0.5"
                    style={employerStyles.input}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div style={employerStyles.step}>
            <h2>Employer Information &amp; NY Pay Notice</h2>

            <div style={employerStyles.formGroup}>
              <label>Employer Name <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="employer_name"
                value={formData.employer_name}
                onChange={handleInputChange}
                placeholder="Official employer name"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Doing Business As (DBA)</label>
              <input
                type="text"
                name="employer_dba"
                value={formData.employer_dba}
                onChange={handleInputChange}
                placeholder="e.g., Trade name"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>FEIN <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="employer_fein"
                value={formData.employer_fein}
                onChange={handleInputChange}
                placeholder="Federal Employer ID"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Business Address <span style={{color:'#d32f2f'}}>*</span></label>
              <textarea
                name="employer_address"
                value={formData.employer_address}
                onChange={handleInputChange}
                placeholder="Street address, city, state, zip"
                style={{ ...employerStyles.input, minHeight: '80px' }}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Business Phone <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="tel"
                name="employer_phone"
                value={formData.employer_phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Regular Payday <span style={{color:'#d32f2f'}}>*</span></label>
              <input
                type="text"
                name="regular_payday"
                value={formData.regular_payday}
                onChange={handleInputChange}
                placeholder="e.g., Friday of each week"
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.divider}></div>

            <h3>Allowances (NY LS-54/LS-59 Requirements)</h3>

            <div style={employerStyles.checkboxGroup}>
              <label style={employerStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="allowances_taken"
                  checked={formData.allowances_taken}
                  onChange={handleInputChange}
                  style={employerStyles.checkbox}
                />
                Are any allowances being taken against wages?
              </label>
            </div>

            {formData.allowances_taken && (
              <div style={employerStyles.allowancesSection}>
                <div style={employerStyles.checkboxGroup}>
                  <label style={employerStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="tip_allowance"
                      checked={formData.tip_allowance}
                      onChange={handleInputChange}
                      style={employerStyles.checkbox}
                    />
                    Tip Allowance
                  </label>
                </div>

                <div style={employerStyles.checkboxGroup}>
                  <label style={employerStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="meal_allowance"
                      checked={formData.meal_allowance}
                      onChange={handleInputChange}
                      style={employerStyles.checkbox}
                    />
                    Meal Allowance
                  </label>
                </div>

                <div style={employerStyles.checkboxGroup}>
                  <label style={employerStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="lodging_allowance"
                      checked={formData.lodging_allowance}
                      onChange={handleInputChange}
                      style={employerStyles.checkbox}
                    />
                    Lodging Allowance
                  </label>
                </div>
              </div>
            )}

            <div style={employerStyles.divider}></div>

            <h3>Pay Notice Document</h3>

            <p style={employerStyles.helpText}>
              New York requires employers to provide the Wage Payment Notice (LS-54 for hourly, LS-59 for salary).
              The relevant form will display below for your information.
            </p>

            <button
              type="button"
              onClick={() => setShowPayNotice(!showPayNotice)}
              style={employerStyles.toggleButton}
            >
              {showPayNotice ? 'Hide' : 'Show'} Required Pay Notice Form
            </button>

            {showPayNotice && (
              <div style={employerStyles.payNoticeContainer}>
                <p style={employerStyles.helpText}>
                  Form: {formData.is_exempt === 'true' ? 'LS-59 (Salary)' : 'LS-54 (Hourly)'}
                </p>
                <iframe
                  src={
                    formData.is_exempt === 'true'
                      ? 'https://docs.google.com/gview?url=https://dol.ny.gov/system/files/documents/2024/12/ls59.pdf&embedded=true'
                      : 'https://docs.google.com/gview?url=https://dol.ny.gov/system/files/documents/2024/12/ls54.pdf&embedded=true'
                  }
                  style={employerStyles.pdfViewer}
                  title="NY Pay Notice"
                ></iframe>
              </div>
            )}

            <div style={employerStyles.formGroup}>
              <label>Primary Language of Communication <span style={{color:'#d32f2f'}}>*</span></label>
              <select
                name="primary_language"
                value={formData.primary_language}
                onChange={handleInputChange}
                style={employerStyles.input}
              >
                <option value="">Select...</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Chinese">Chinese</option>
                <option value="Korean">Korean</option>
                <option value="French">French</option>
                <option value="Italian">Italian</option>
                <option value="Polish">Polish</option>
                <option value="Russian">Russian</option>
                <option value="Yiddish">Yiddish</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {formData.primary_language === 'Other' && (
              <div style={employerStyles.formGroup}>
                <label>Specify Language</label>
                <input
                  type="text"
                  name="other_language"
                  value={formData.other_language}
                  onChange={handleInputChange}
                  placeholder="Please specify"
                  style={employerStyles.input}
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div style={employerStyles.step}>
            <h2>Certification &amp; Submission</h2>

            <div style={employerStyles.reviewSection}>
              <h3>Review Your Information</h3>

              <div style={employerStyles.reviewCategory}>
                <h4>Company Information</h4>
                <p><strong>Company Code:</strong> {formData.company_code || 'Not specified'}</p>
                <p><strong>Legal Name:</strong> {formData.legal_name || 'Not specified'}</p>
                <p><strong>EIN:</strong> {formData.ein || 'Not specified'}</p>
                <p><strong>Hire Type:</strong> {formData.hire_type || 'Not specified'}</p>
                <p><strong>Employee Type:</strong> {formData.employee_type || 'Not specified'}</p>
              </div>

              <div style={employerStyles.reviewCategory}>
                <h4>Position &amp; Pay</h4>
                <p><strong>Job Title:</strong> {formData.job_title || 'Not specified'}</p>
                <p><strong>Department:</strong> {formData.department || 'Not specified'}</p>
                <p><strong>Supervisor:</strong> {formData.supervisor_name || 'Not specified'}</p>
                <p><strong>Work Location:</strong> {formData.work_location || 'Not specified'}</p>
                <p><strong>Pay Frequency:</strong> {formData.pay_frequency || 'Not specified'}</p>
                <p><strong>Status:</strong> {formData.is_exempt === 'true' ? 'Exempt (Salary)' : formData.is_exempt === 'false' ? 'Non-Exempt (Hourly)' : 'Not specified'}</p>
                {formData.is_exempt === 'true' && (
                  <p><strong>Annual Salary:</strong> {formatCurrency(formData.annual_salary)}</p>
                )}
                {formData.is_exempt === 'false' && (
                  <>
                    <p><strong>Hourly Rate:</strong> {formatCurrency(formData.hourly_rate)}/hr</p>
                    <p><strong>Standard Hours/Week:</strong> {formData.standard_hours_per_week || 'Not specified'}</p>
                  </>
                )}
              </div>

              <div style={employerStyles.reviewCategory}>
                <h4>Employer Information</h4>
                <p><strong>Employer Name:</strong> {formData.employer_name || 'Not specified'}</p>
                <p><strong>DBA:</strong> {formData.employer_dba || 'Not specified'}</p>
                <p><strong>FEIN:</strong> {formData.employer_fein || 'Not specified'}</p>
                <p><strong>Address:</strong> {(formData.employer_address || 'Not specified').replace(/\n/g, ', ')}</p>
                <p><strong>Phone:</strong> {formData.employer_phone || 'Not specified'}</p>
                <p><strong>Regular Payday:</strong> {formData.regular_payday || 'Not specified'}</p>
              </div>

              <div style={employerStyles.reviewCategory}>
                <h4>Pay Notice &amp; Language</h4>
                <p><strong>Allowances Taken:</strong> {formData.allowances_taken ? 'Yes' : 'No'}</p>
                {formData.allowances_taken && (
                  <p>
                    <strong>Allowance Types:</strong> {
                      [
                        formData.tip_allowance && 'Tips',
                        formData.meal_allowance && 'Meals',
                        formData.lodging_allowance && 'Lodging'
                      ].filter(Boolean).join(', ') || 'None selected'
                    }
                  </p>
                )}
                <p><strong>Primary Language:</strong> {formData.primary_language || 'Not specified'}</p>
                {formData.other_language && (
                  <p><strong>Other Language:</strong> {formData.other_language}</p>
                )}
              </div>
            </div>

            <div style={employerStyles.divider}></div>

            <div style={employerStyles.certificationBox}>
              <h3>Certification</h3>
              <p>
                I certify that the above information is true, accurate, and complete to the best of my knowledge.
                I understand that this information will be used for the employee's onboarding and compliance with
                federal and state employment laws, including New York's wage and hour requirements.
              </p>
              <p>
                The employee has been provided with the appropriate NY Wage Payment Notice (LS-54 or LS-59)
                prior to or on their first day of employment.
              </p>
            </div>
          </div>
        )}

        <div style={employerStyles.buttonGroup}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              style={employerStyles.buttonSecondary}
              disabled={submitting}
            >
              Previous
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              style={employerStyles.buttonPrimary}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              style={employerStyles.buttonPrimary}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit & Complete'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={employerStyles.errorBannerBottom}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

// Export to global scope for App component
window.EmployerForm = EmployerForm;
