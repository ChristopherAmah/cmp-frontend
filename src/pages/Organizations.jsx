import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { organizationService } from "../services/organizationService";
import DashboardLayout from "../components/DashboardLayout";
import CreateOrganizationWizard from "../components/CreateOrganizationWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Plus, Search, Loader2, Trash2 } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

const Organizations = () => {
  const { toast } = useToast();
  const { canDeleteOrganizations, canCreateOrganizations } = usePermissions();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const LIMIT = 100;
  const [showCreateOrganizationWizard, setShowCreateOrganizationWizard] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations({ nextPage: 1, replace: true, search: "" });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrganizations({
        nextPage: 1,
        replace: true,
        search: searchTerm,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchOrganizations = async ({ nextPage, replace, search }) => {
    try {
      setLoading(true);
      const response = await organizationService.getAll({
        page: nextPage,
        limit: LIMIT,
        search: search?.trim() || undefined,
      });
      if (response.status === "success") {
        setOrganizations((prev) =>
          replace ? response.data : [...prev, ...response.data]
        );
        setMeta(response.meta || null);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteOrganization = async (orgId) => {
    if (
      !confirm(
        "Are you sure you want to delete this organization? This action cannot be undone and will delete all associated contracts and documents."
      )
    ) {
      return;
    }

    setDeletingId(orgId);
    try {
      const response = await organizationService.delete(orgId);
      if (response.status === "success") {
        toast({
          title: "Success",
          description: "Organization deleted successfully.",
          variant: "success",
        });
        fetchOrganizations({ nextPage: 1, replace: true, search: searchTerm });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete organization",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrganizations = organizations;
  const total = meta?.total;
  const canLoadMore = typeof total === "number" && organizations.length < total;

  return (
    <DashboardLayout>
      <div className="">
        <div className=" px-6 sm:px-8 lg:px-12 py-12">
          {/* Header - Stripe Style */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground dark:text-foreground mb-2">
                  Partner & Organization Directory
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground">
                  Centralized management of business entities and contractual
                  relationships
                </p>
              </div>
              {canCreateOrganizations && (
                <Button
                  onClick={() => setShowCreateOrganizationWizard(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 sm:h-11 px-4 sm:px-6 rounded-lg font-medium transition-colors w-full sm:w-auto flex-shrink-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Organization
                </Button>
              )}
            </div>
          </div>

          {/* Search and Table Card - Stripe Style */}
          <Card className="border border-border dark:border-border rounded-xl bg-card">
            <CardHeader className="border-b border-border dark:border-border px-6 py-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
                    All Organizations
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    View and manage your contract organizations
                  </CardDescription>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 border-border dark:border-border rounded-lg bg-card dark:bg-background focus:border-slate-400 dark:focus:border-slate-600"
                  />
                </div>
              </div>
              {searchTerm && (
                <p className="mt-3 text-xs text-muted-foreground dark:text-muted-foreground">
                  Showing {filteredOrganizations.length}
                  {typeof total === "number" ? ` of ${total}` : ""}{" "}
                  organizations
                </p>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrganizations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-secondary dark:bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-2">
                    No organizations
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-sm mx-auto mb-6">
                    {searchTerm
                      ? "No organizations match your search."
                      : "Get started by adding a new organization."}
                  </p>
                  {!searchTerm && canCreateOrganizations && (
                    <Button
                      onClick={() => setShowCreateOrganizationWizard(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Organization
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border dark:border-border hover:bg-transparent">
                          <TableHead className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-6 py-4">
                            Organization Name
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-6 py-4">
                            Type
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-6 py-4 max-w-xs">
                            Description
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-6 py-4">
                            Created
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-6 py-4">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrganizations.map((org) => (
                          <TableRow
                            key={org._id}
                            className="border-b border-slate-100 dark:border-border hover:bg-background dark:hover:bg-card/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/organization/${org._id}`)}
                          >
                            <TableCell className="px-6 py-4 font-medium text-foreground dark:text-foreground">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary dark:bg-card rounded-lg">
                                  <Building2 className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                                </div>
                                {org.name}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
                                {org.organizationType || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4 max-w-xs truncate text-sm text-muted-foreground dark:text-muted-foreground">
                              {org.description || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm text-muted-foreground dark:text-muted-foreground">
                              {new Date(org.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/organization/${org._id}`);
                                  }}
                                  className="h-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                >
                                  View
                                </Button>
                                {canDeleteOrganizations && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteOrganization(org._id);
                                    }}
                                    disabled={deletingId === org._id}
                                    className="h-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  >
                                    {deletingId === org._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {canLoadMore && (
                    <div className="flex justify-center py-6 border-t border-border dark:border-border">
                      <Button
                        variant="outline"
                        onClick={() =>
                          fetchOrganizations({
                            nextPage: page + 1,
                            replace: false,
                            search: searchTerm,
                          })
                        }
                        className="border-border dark:border-border h-9"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Create Organization Wizard */}
          <CreateOrganizationWizard
            isOpen={showCreateOrganizationWizard}
            onClose={() => setShowCreateOrganizationWizard(false)}
            onSuccess={() => {
              setShowCreateOrganizationWizard(false);
              fetchOrganizations({ nextPage: 1, replace: true, search: searchTerm });
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Organizations;
