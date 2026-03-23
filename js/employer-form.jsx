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

        const { data, error: queryError } = await supabase
          .from('submissions')
          .select('*')
          .eq('employer_token', token)
          .eq('status', 'employee_complete')
          .single();

        if (queryError || !data) {
          setError('Invalid, expired, or already used token. Please request a new link from the employee.');
          setLoading(false);
          return;
        }

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
            is_exempt: data.is_exempt !== null ? data.is_exempt : '',
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
  };

  const maskSSN = (ssn) => {
    if (!ssn) return '';
    return `***-**-${ssn.slice(-4)}`;
  };

  const maskBankAccount = (account) => {
    if (!account) return '';
    return `****${account.slice(-4)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('submissions')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) {
        setError(`Failed to update submission: ${updateError.message}`);
        setSubmitting(false);
        return;
      }

      await fetch(`${SUPABASE_URL}/functions/v1/notify-new-hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id })
      });

      setSubmitting(false);
      setSubmitSuccess(true);
    } catch (err) {
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
          <div style={employerStyles.successIcon}>✓</div>
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
        <p>Phase 2: Company & Position Information</p>
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

      {error && (
        <div style={employerStyles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={employerStyles.form}>
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
              <label>Company Code *</label>
              <input
                type="text"
                name="company_code"
                value={formData.company_code}
                onChange={handleInputChange}
                placeholder="e.g., ABC-2025"
                required
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Legal Company Name *</label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleInputChange}
                placeholder="Full legal company name"
                required
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>EIN (Employer Identification Number) *</label>
              <input
                type="text"
                name="ein"
                value={formData.ein}
                onChange={handleInputChange}
                placeholder="00-0000000"
                required
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formRow}>
              <div style={employerStyles.formGroup}>
                <label>Hire Type *</label>
                <select
                  name="hire_type"
                  value={formData.hire_type}
                  onChange={handleInputChange}
                  required
                  style={employerStyles.input}
                >
                  <option value="">Select...</option>
                  <option value="new">New Hire</option>
                  <option value="rehire">Rehire</option>
                  <option value="transfer">Internal Transfer</option>
                </select>
              </div>

              <div style={employerStyles.formGroup}>
                <label>Employee Type *</label>
                <select
                  name="employee_type"
                  value={formData.employee_type}
                  onChange={handleInputChange}
                  required
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
            <h2>Position & Pay Information</h2>

            <div style={employerStyles.formGroup}>
              <label>Job Title *</label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer"
                required
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
              <label>Work Location *</label>
              <input
                type="text"
                name="work_location"
                value={formData.work_location}
                onChange={handleInputChange}
                placeholder="e.g., New York, NY Office"
                required
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formRow}>
              <div style={employerStyles.formGroup}>
                <label>Pay Frequency *</label>
                <select
                  name="pay_frequency"
                  value={formData.pay_frequency}
                  onChange={handleInputChange}
                  required
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
                <label>Exempt Status *</label>
                <select
                  name="is_exempt"
                  value={formData.is_exempt}
                  onChange={handleInputChange}
                  required
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
                <label>Annual Salary *</label>
                <input
                  type="number"
                  name="annual_salary"
                  value={formData.annual_salary}
                  onChange={handleInputChange}
                  placeholder="e.g., 75000"
                  step="0.01"
                  required
                  style={employerStyles.input}
                />
              </div>
            )}

            {formData.is_exempt === 'false' && (
              <div style={employerStyles.formRow}>
                <div style={employerStyles.formGroup}>
                  <label>Hourly Rate *</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    placeholder="e.g., 25.00"
                    step="0.01"
                    required
                    style={employerStyles.input}
                  />
                </div>

                <div style={employerStyles.formGroup}>
                  <label>Standard Hours per Week *</label>
                  <input
                    type="number"
                    name="standard_hours_per_week"
                    value={formData.standard_hours_per_week}
                    onChange={handleInputChange}
                    placeholder="e.g., 40"
                    step="0.5"
                    required
                    style={employerStyles.input}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div style={employerStyles.step}>
            <h2>Employer Information & NY Pay Notice</h2>

            <div style={employerStyles.formGroup}>
              <label>Employer Name *</label>
              <input
                type="text"
                name="employer_name"
                value={formData.employer_name}
                onChange={handleInputChange}
                placeholder="Official employer name"
                required
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
              <label>FEIN *</label>
              <input
                type="text"
                name="employer_fein"
                value={formData.employer_fein}
                onChange={handleInputChange}
                placeholder="Federal Employer ID"
                required
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Business Address *</label>
              <textarea
                name="employer_address"
                value={formData.employer_address}
                onChange={handleInputChange}
                placeholder="Street address, city, state, zip"
                required
                style={{ ...employerStyles.input, minHeight: '80px' }}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Business Phone *</label>
              <input
                type="tel"
                name="employer_phone"
                value={formData.employer_phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                required
                style={employerStyles.input}
              />
            </div>

            <div style={employerStyles.formGroup}>
              <label>Regular Payday *</label>
              <input
                type="text"
                name="regular_payday"
                value={formData.regular_payday}
                onChange={handleInputChange}
                placeholder="e.g., Friday of each week"
                required
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
              <label>Primary Language of Communication *</label>
              <select
                name="primary_language"
                value={formData.primary_language}
                onChange={handleInputChange}
                required
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
            <h2>Certification & Submission</h2>

            <div style={employerStyles.reviewSection}>
              <h3>Review Your Information</h3>

              <div style={employerStyles.reviewCategory}>
                <h4>Company Information</h4>
                <p><strong>Company Code:</strong> {formData.company_code}</p>
                <p><strong>Legal Name:</strong> {formData.legal_name}</p>
                <p><strong>EIN:</strong> {formData.ein}</p>
                <p><strong>Hire Type:</strong> {formData.hire_type}</p>
                <p><strong>Employee Type:</strong> {formData.employee_type}</p>
              </div>

              <div style={employerStyles.reviewCategory}>
                <h4>Position & Pay</h4>
                <p><strong>Job Title:</strong> {formData.job_title}</p>
                <p><strong>Department:</strong> {formData.department || 'Not specified'}</p>
                <p><strong>Supervisor:</strong> {formData.supervisor_name || 'Not specified'}</p>
                <p><strong>Work Location:</strong> {formData.work_location}</p>
                <p><strong>Pay Frequency:</strong> {formData.pay_frequency}</p>
                <p><strong>Status:</strong> {formData.is_exempt === 'true' ? 'Exempt (Salary)' : 'Non-Exempt (Hourly)'}</p>
                {formData.is_exempt === 'true' ? (
                  <p><strong>Annual Salary:</strong> ${parseFloat(formData.annual_salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                ) : (
                  <>
                    <p><strong>Hourly Rate:</strong> ${parseFloat(formData.hourly_rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hr</p>
                    <p><strong>Standard Hours/Week:</strong> {formData.standard_hours_per_week}</p>
                  </>
                )}
              </div>

              <div style={employerStyles.reviewCategory}>
                <h4>Employer Information</h4>
                <p><strong>Employer Name:</strong> {formData.employer_name}</p>
                <p><strong>DBA:</strong> {formData.employer_dba || 'Not specified'}</p>
                <p><strong>FEIN:</strong> {formData.employer_fein}</p>
                <p><strong>Address:</strong> {formData.employer_address.replace(/\n/g, ', ')}</p>
                <p><strong>Phone:</strong> {formData.employer_phone}</p>
                <p><strong>Regular Payday:</strong> {formData.regular_payday}</p>
              </div>

              <div style={employerStyles.reviewCategory}>
                <h4>Pay Notice & Language</h4>
                <p><strong>Allowances Taken:</strong> {formData.allowances_taken ? 'Yes' : 'No'}</p>
                {formData.allowances_taken && (
                  <p>
                    <strong>Allowance Types:</strong> {
                      [
                        formData.tip_allowance && 'Tips',
                        formData.meal_allowance && 'Meals',
                        formData.lodging_allowance && 'Lodging'
                      ].filter(Boolean).join(', ')
                    }
                  </p>
                )}
                <p><strong>Primary Language:</strong> {formData.primary_language}</p>
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
              onClick={() => setCurrentStep(currentStep - 1)}
              style={employerStyles.buttonSecondary}
              disabled={submitting}
            >
              Previous
            </button>
          )}

          <button
            type="submit"
            style={employerStyles.buttonPrimary}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : currentStep < 5 ? 'Next' : 'Submit & Complete'}
          </button>
        </div>
      </form>

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