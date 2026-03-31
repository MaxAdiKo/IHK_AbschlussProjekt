import { gs, GlideRecord } from '@servicenow/glide'

var LicenseDataAPI = Class.create();
LicenseDataAPI.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
    
    /**
     * Get licenses for a specific employee ID
     * @returns {string} JSON string of filtered and transformed license data
     */
    getLicensesForEmployee: function() {
        var employeeId = this.getParameter('sysparm_employee_id');
        
        if (!employeeId) {
            return JSON.stringify({
                success: false,
                error: 'Employee ID is required'
            });
        }
        
        try {
            var licenses = [];
            var gr = new GlideRecord('u_software_license');
            
            // Filter by employee ID
            gr.addQuery('u_employee_id', employeeId);
            gr.query();
            
            while (gr.next()) {
                var license = {
                    sys_id: gr.getUniqueValue(),
                    u_import_id: gr.getValue('u_import_id'),
                    u_product: gr.getValue('u_product'),
                    u_employee_id: gr.getValue('u_employee_id'),
                    u_last_used: gr.getValue('u_last_used'),
                    u_status: gr.getValue('u_status'),
                    u_cost: gr.getValue('u_cost')
                };
                licenses.push(license);
            }
            
            return JSON.stringify({
                success: true,
                result: licenses,
                count: licenses.length
            });
            
        } catch (error) {
            gs.error('LicenseDataAPI.getLicensesForEmployee - Error: ' + error.message);
            return JSON.stringify({
                success: false,
                error: 'Failed to retrieve license data: ' + error.message
            });
        }
    },
    
    /**
     * Validate if employee ID exists in the license table
     * @returns {string} JSON string indicating if employee has licenses
     */
    validateEmployeeId: function() {
        var employeeId = this.getParameter('sysparm_employee_id');
        
        if (!employeeId) {
            return JSON.stringify({
                success: false,
                error: 'Employee ID is required'
            });
        }
        
        try {
            var gr = new GlideRecord('u_software_license');
            gr.addQuery('u_employee_id', employeeId);
            gr.setLimit(1);
            gr.query();
            
            var hasLicenses = gr.hasNext();
            
            return JSON.stringify({
                success: true,
                hasLicenses: hasLicenses,
                employeeId: employeeId
            });
            
        } catch (error) {
            gs.error('LicenseDataAPI.validateEmployeeId - Error: ' + error.message);
            return JSON.stringify({
                success: false,
                error: 'Failed to validate employee ID: ' + error.message
            });
        }
    },
    
    type: 'LicenseDataAPI'
});