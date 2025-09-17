import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteInvitationCode, generateInvitationCode } from "../seller-action";
import { toast } from "sonner"
import { CodesResponse } from "../types";



export function useDeleteCodeMutation() {
  const queryClient = useQueryClient(); // Initialize query client

 const mutation =  useMutation({
    mutationFn: deleteInvitationCode,
    onSuccess: async (deletedCode) => {
      const queryFilter: QueryFilters = { queryKey: ["invitation-codes"] };
      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<CodesResponse, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData) return; // If no data exists, return undefined

          return {
            pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => ({
            nextCursor: page.nextCursor,
            codes: page.codes.filter((code) => code.id !== deletedCode?.id),
          })),
          };
        }

      );
        toast.success("Invitation code deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting code:", error);
      toast.error("Failed to delete invitation code");
    },

  });
return  mutation;
  
}

export function  useGenerateCodeMutation() {
      const queryClient = useQueryClient();

      const mutation = useMutation({
        mutationFn: generateInvitationCode,
        onSuccess:async (newCode) => {
  const queryFilter: QueryFilters = { queryKey: ["invitation-codes"] };
      await queryClient.cancelQueries(queryFilter);

            queryClient.setQueriesData<InfiniteData<CodesResponse, string | null>>(queryFilter,
                (oldData) => {
                    const firstPage = oldData?.pages[0];
               if(firstPage)
                   return {
                       pageParams: oldData.pageParams,
                       pages: [
                           {
                               codes:[newCode,...firstPage.codes],
                               nextCursor: firstPage.nextCursor

                           },
                            ...oldData.pages.slice(1)
                        ]
                    };
                }
            );

            toast.success("Invitation code generated successfully");
            

      
          

            

      

        },
        onError: (error) => {
            console.error("Error generating code:", error);
            toast.error("Failed to generate invitation code");
            }
        });
        return mutation;
        }
  