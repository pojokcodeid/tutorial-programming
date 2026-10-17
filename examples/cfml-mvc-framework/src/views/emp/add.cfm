<cfoutput>
    <div class="container mt-5">
        <cfset var message = new core.Message()>
        <cfset var flash = message.getFlash()>
        <cfset data = { name = "", email = "", age = "" }>
        <cfif structKeyExists(flash, "type")>
            <div class="alert alert-#flash.type# alert-dismissible fade show" role="alert">
                #flash.message#
                <cfset data = flash.data>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </cfif>
        <h3>Add Employee</h3>
        <form class="mt-4" action="#application.baseURL#/employee" method="post" enctype="multipart/form-data">
            <div class="mb-3 row">
                <label for="name" class="col-sm-2 col-form-label">Name</label>
                <div class="col-sm-10">
                    <input type="text" class="form-control" name="name" id="name" value="#encodeForHTML(data.name)#">
                </div>
            </div>
            <div class="mb-3 row">
                <label for="email" class="col-sm-2 col-form-label">Email</label>
                <div class="col-sm-5">
                    <input type="text" class="form-control" name="email" id="email" value="#encodeForHTML(data.email)#">
                </div>
            </div>
            <div class="mb-3 row">
                <label for="age" class="col-sm-2 col-form-label">Age</label>
                <div class="col-sm-3">
                    <input type="text" class="form-control" name="age" id="age" value="#encodeForHTML(data.age)#">
                </div>
            </div>
            <div class="mb-3 row">
                <label for="lampiran" class="col-sm-2 col-form-label">Lampiran</label>
                <div class="col-sm-3">
                    <input type="file" class="form-control" name="lampiran" id="lampiran">
                </div>
            </div>
            <div class="mb-3 row">
                <div class="col-sm-2"></div>
                <div class="col-sm-3">
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </div>
        </form>
    </div>
</cfoutput>
