<cfoutput>
    <div class="container mt-5">
        <cfset var message = new core.Message()>
        <cfset var flash = message.getFlash()>

        <cfif structKeyExists(flash, "type")>
            <div class="alert alert-#flash.type# alert-dismissible fade show" role="alert">
                #flash.message#
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </cfif>

        <h3>Daftar Employee</h3>
        <a href="#application.baseURL#/employee/add" class="btn btn-primary btn-sm my-3">Add New</a>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th scope="col">##</th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Age</th>
                    <th scope="col"></th>
                </tr>
            </thead>
            <tbody>
                <cfset no = 0>
                <cfloop array="#data#" index="i">
                    <cfset no = no + 1>
                    <tr>
                        <th scope="row">#no#</th>
                        <td>#encodeForHTML(i.name)#</td>
                        <td>#encodeForHTML(i.email)#</td>
                        <td>#i.age#</td>
                        <td>
                            <a href="#application.baseURL#/employee/edit/#i.id#" class="btn btn-sm btn-success">Edit</a>
                            <a href="#application.baseURL#/employee/delete/#i.id#" class="btn btn-sm btn-danger"
                               onclick="return confirm('Yakin hapus data ini?')">Delete</a>
                        </td>
                    </tr>
                </cfloop>
            </tbody>
        </table>
    </div>
</cfoutput>
