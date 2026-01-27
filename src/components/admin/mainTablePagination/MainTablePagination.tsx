import { Button } from '@/components/ui/button';
import type { PaginationType } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MainTablePagination = ({
    pagination,
    onChangePagination,
    disabled,
}: {
    pagination: PaginationType;
    onChangePagination: (pagination: PaginationType) => void;
    disabled?: boolean;
}) => {
    return (

        <div className="p-2 flex justify-end items-center gap-2">
            {/* Pagination Controls could go here */}
            <Button size={'icon'}
                disabled={pagination.page === 1}
                onClick={() => onChangePagination({
                    ...pagination,
                    page: Math.max(pagination.page - 1, 1),
                })}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
                Página {pagination.page}
            </span>
            <Button
                size={'icon'}
                disabled={disabled}
                onClick={() => onChangePagination({
                    ...pagination,
                    page: pagination.page + 1,
                })}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

export default MainTablePagination