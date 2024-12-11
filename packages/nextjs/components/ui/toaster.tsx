import { type UseToastOptions, useToast as useChakraToast } from "@chakra-ui/toast";

export function useToast() {
  const toast = useChakraToast();

  return {
    create: (props: {
      title?: string;
      description: string;
      type?: "success" | "error" | "info";
      duration?: number;
    }) => {
      toast({
        title: props.title,
        description: props.description,
        status: props.type,
        duration: props.duration || 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  };
}
