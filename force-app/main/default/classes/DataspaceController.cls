public with sharing class DataspaceController {
    @AuraEnabled(cacheable=true)
    public static List<Dataspace> getDataspaces() {
        return [
            SELECT Id, Name
            FROM Dataspace
            WITH SECURITY_ENFORCED
            ORDER BY Name
        ];
    }
}